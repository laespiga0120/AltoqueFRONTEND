import { EmailRequest } from "../types/loan";

const API_BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8080";

export const notificationService = {
  /**
   * Envía los documentos (contrato y cronograma) al correo del cliente.
   */
  sendDocumentsByEmail: async (payload: EmailRequest): Promise<string> => {
    const response = await fetch(
      `${API_BASE_URL}/api/notificaciones/enviar-documentos`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    const responseText = await response.text();
    if (!response.ok) {
      throw new Error(responseText || "Error al enviar el correo.");
    }
    return responseText;
  },
};
