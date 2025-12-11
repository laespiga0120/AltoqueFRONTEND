import { ClientSummary, ClientDetail } from "../types/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "https://al-toque-d0b27cb5aec4.herokuapp.com";

// Extendemos ClientSummary para asegurar que tenga ID, necesario para buscar el estado de cuenta
export interface ClientSearchResult extends ClientSummary {
    idCliente: number;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  console.log(`📡 Fetching: ${url}`); 
  
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorText = await response.text();
    console.error(`❌ Error ${response.status}:`, errorText);
    throw new Error(`Error ${response.status}: ${response.statusText}`);
  }
  if (response.status === 204) {
      return null as any;
  }
  return response.json();
}

/**
 * Función genérica para descarga de PDF (sin cambios)
 */
async function downloadPdf(endpoint: string, options: RequestInit, filename: string) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) throw new Error("Error generando PDF");
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Fallo descarga PDF", error);
  }
}

export const clientService = {
    // ... Métodos existentes (searchByDocument, getDetails, etc.) ...

    searchByDocument: async (documento: string): Promise<ClientSummary | null> => {
        try {
          const data = await fetchJson<ClientSummary>(`${API_BASE_URL}/api/clientes/consulta/${documento}`);
          return data;
        } catch (error) {
            console.warn("Cliente no encontrado:", error);
            return null;
        }
    },

    getDetailsByDocument: async (documento: string): Promise<ClientDetail> => {
       return await fetchJson<ClientDetail>(`${API_BASE_URL}/api/clientes/detalles/${documento}`);
    },

    registerOrUpdate: async (clientData: Partial<ClientDetail>): Promise<ClientDetail> => {
      return await fetchJson<ClientDetail>(`${API_BASE_URL}/api/clientes/registrarOActualizar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      });
    },

    // --- CORRECCIÓN FINAL AQUÍ ---
    searchClients: async (query: string): Promise<ClientSearchResult[]> => {
        if (!query || query.length < 2) return [];
        
        try {
            // El backend ya devuelve objetos con las claves correctas (idCliente, nombreCliente, etc.)
            // según tus logs.
            const rawData = await fetchJson<any[]>(`${API_BASE_URL}/api/clientes/buscar?query=${encodeURIComponent(query)}`);
            
            console.log("📦 Data backend:", rawData);

            // Simplemente aseguramos que cumpla la interfaz, o hacemos un mapeo ligero si falta algo
            const mappedResults: ClientSearchResult[] = rawData.map((c: any) => ({
                // Usamos las claves QUE VIMOS EN EL LOG
                idCliente: c.idCliente || c.id, // Fallback por si acaso
                tipo: c.tipoCliente || c.tipo || 'NATURAL', // Ajuste según tu log (dice 'tipoCliente')
                
                dniCliente: c.dniCliente,
                ruc: c.ruc,
                razonSocial: c.razonSocial,
                nombreCliente: c.nombreCliente,
                apellidoCliente: c.apellidoCliente,
                
                tienePrestamoActivo: c.tienePrestamoActivo || false
            }));

            console.log("✨ Resultados listos:", mappedResults);
            return mappedResults;

        } catch (error) {
            console.error("🔥 Error en searchClients:", error);
            return [];
        }
    },

    downloadPEPPdf: (clientData: ClientDetail) => Promise.resolve(), 
    downloadUITPdf: (clientData: ClientDetail, amount: number) => Promise.resolve(),
};