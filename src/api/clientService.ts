import { ClientSummary, ClientDetail } from "@/types/client";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

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
  // --- FUNCIÓN RESTAURADA ---
  // Esta función es la que usa el Dashboard para la búsqueda inicial.
  searchByDNI: async (dni: string): Promise<ClientSummary> => {
    const response = await fetch(
      `${API_BASE_URL}/api/clientes/consulta/${dni}`
    );
    if (!response.ok) {
      // El backend devuelve un 404 si no lo encuentra, lo que se convierte en un error aquí.
      throw new Error("Cliente no encontrado o DNI inválido.");
    }
    return response.json();
  },

  getDetailsByDNI: async (dni: string): Promise<ClientDetail> => {
    const response = await fetch(
      `${API_BASE_URL}/api/clientes/detalles/${dni}`
    );
    if (!response.ok)
      throw new Error("No se pudieron obtener los detalles del cliente");
    return response.json();
  },

  registerOrUpdate: async (
    clientData: Partial<ClientDetail>
  ): Promise<ClientDetail> => {
    const response = await fetch(
      `${API_BASE_URL}/api/clientes/registrarOActualizar`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      }
    );
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        errorText || "Error al registrar o actualizar el cliente"
      );
    }
    return response.json();
  },

  downloadPEPPdf: (clientData: ClientDetail): Promise<void> => {
    return downloadPdf(
      "/api/prestamos/documentos/declaracion-pep",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(clientData),
      },
      `Declaracion_PEP_${clientData.dniCliente}.pdf`
    );
  },

  downloadUITPdf: (clientData: ClientDetail, amount: number): Promise<void> => {
    return downloadPdf(
      "/api/prestamos/documentos/declaracion-uit",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ client: clientData, amount: amount }),
      },
      `Declaracion_Jurada_UIT_${clientData.dniCliente}.pdf`
    );
  },
};
