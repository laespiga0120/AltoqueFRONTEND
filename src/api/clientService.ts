import { ClientSummary, ClientDetail } from "../types/client";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

/**
 * Helper para peticiones JSON genéricas
 */
async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
     // Intenta leer el mensaje de error del backend
    const errorText = await response.text();
    let errorMessage = `Error ${response.status}: ${response.statusText}`;
    try {
        const errorJson = JSON.parse(errorText);
        if(errorJson.message) errorMessage = errorJson.message;
    } catch(e) {}
    
    throw new Error(errorMessage);
  }
  // Manejo de respuestas vacías (como en el caso de buscar por RUC y no encontrar nada)
  if (response.status === 204) {
      return null as any;
  }
  return response.json();
}

/**
 * Función genérica para manejar la descarga de archivos PDF.
 */
async function downloadPdf(
  endpoint: string,
  options: RequestInit,
  filename: string
) {
  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || "Error al generar el documento PDF desde el servidor."
      );
    }
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
    console.error("Fallo la descarga del PDF:", error);
    throw error;
  }
}

export const clientService = {
  
  // 1. Búsqueda General (DNI o RUC) para el Dashboard
  searchByDocument: async (documento: string): Promise<ClientSummary | null> => {
      // El backend ahora maneja la lógica de longitud en un solo endpoint o tú decides cual llamar
      // Dado tu backend actual, `consultarClienteYEstadoPrestamo` maneja ambas longitudes.
      try {
        const data = await fetchJson<ClientSummary>(`${API_BASE_URL}/api/clientes/consulta/${documento}`);
        return data; 
      } catch (error) {
          // Si es 404, significa que no se encontró (especialmente para RUCs nuevos en BD local)
          // Retornamos null para que el frontend habilite el registro.
          console.warn("Cliente no encontrado:", error);
          return null;
      }
  },

  // Mantener por compatibilidad si se usa explícitamente, pero searchByDocument es preferible
  searchByDNI: async (dni: string) => clientService.searchByDocument(dni),
  searchByRUC: async (ruc: string) => clientService.searchByDocument(ruc),

  // 2. Obtener Detalles para el Formulario (Pre-llenado)
  getDetailsByDocument: async (documento: string): Promise<ClientDetail> => {
     // Este endpoint del backend devuelve los datos de la BD o consulta la API externa si es DNI
     // Si es RUC y no existe, devuelve un DTO vacío con esNuevo=true (según tu lógica Java)
     return await fetchJson<ClientDetail>(`${API_BASE_URL}/api/clientes/detalles/${documento}`);
  },

  // Wrappers de compatibilidad
  getDetailsByDNI: async (dni: string) => clientService.getDetailsByDocument(dni),
  getDetailsByRUC: async (ruc: string) => clientService.getDetailsByDocument(ruc),


  // 3. Registrar o Actualizar Cliente
  registerOrUpdate: async (clientData: Partial<ClientDetail>): Promise<ClientDetail> => {
    return await fetchJson<ClientDetail>(`${API_BASE_URL}/api/clientes/registrarOActualizar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(clientData),
    });
  },

  // 4. Descargas de PDF
  downloadPEPPdf: (clientData: ClientDetail): Promise<void> => {
    const id = clientData.dniCliente || clientData.ruc || "documento";
    return downloadPdf(
      "/api/prestamos/documentos/declaracion-pep",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      },
      `Declaracion_PEP_${id}.pdf`
    );
  },

  downloadUITPdf: (clientData: ClientDetail, amount: number): Promise<void> => {
    const id = clientData.dniCliente || clientData.ruc || "documento";
    return downloadPdf(
      "/api/prestamos/documentos/declaracion-uit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: clientData, amount: amount }),
      },
      `Declaracion_Jurada_UIT_${id}.pdf`
    );
  },
};