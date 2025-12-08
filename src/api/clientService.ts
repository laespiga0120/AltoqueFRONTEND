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
    const data = await response.json();
    return {
      ...data,
      tipo: "NATURAL", // Por defecto es Natural si viene de este endpoint
    };
  },

  searchByRUC: async (ruc: string): Promise<ClientSummary> => {
    // MOCK DATA para RUC
    // Simulación: Si el RUC es "20600000001", devolvemos una empresa con préstamo activo.
    // Si es "20600000002", devolvemos una empresa sin préstamo.
    // Cualquier otro RUC lanza error (no encontrado).

    await new Promise((resolve) => setTimeout(resolve, 800)); // Simular delay de network

    if (ruc === "20600000001") {
      return {
        ruc: "20600000001",
        razonSocial: "EMPRESA MOCK S.A.C.",
        dniCliente: "", // No aplica
        nombreCliente: "", // No aplica
        apellidoCliente: "", // No aplica
        tipo: "JURIDICA",
        tienePrestamoActivo: true,
      };
    }

    if (ruc === "20600000002") {
      return {
        ruc: "20600000002",
        razonSocial: "SOLUCIONES TECNOLOGICAS E.I.R.L.",
        dniCliente: "",
        nombreCliente: "",
        apellidoCliente: "",
        tipo: "JURIDICA",
        tienePrestamoActivo: false,
      };
    }

    throw new Error("Cliente jurídico no encontrado.");
  },

  getDetailsByRUC: async (ruc: string): Promise<ClientDetail> => {
     // MOCK DATA para Detalles de RUC
     // Si es nuevo (cualquiera que no sea los mocks conocidos), devolvemos vacio/nuevo
     await new Promise((resolve) => setTimeout(resolve, 500)); 

     if (ruc === "20600000002") {
        return {
           idCliente: "MCK-002",
           ruc: "20600000002",
           razonSocial: "SOLUCIONES TECNOLOGICAS E.I.R.L.",
           direccionFiscal: "AV. MOCK 123",
           fechaConstitucion: "2020-01-01T00:00:00",
           representanteLegalDni: "40000000",
           representanteLegalNombre: "JUAN MOCK",
           tipo: "JURIDICA",
           esNuevo: false,
           // Campos requeridos por interfaz pero pueden ser null/vacios en PJ si no aplican
           dniCliente: "",
           nombreCliente: "",
           apellidoCliente: "",
           fechaNacimiento: null,
           esPep: false,
           correoCliente: "contacto@soluciones.mock",
           telefonoCliente: "999000000",
           direccionCliente: "AV. MOCK 123",
        };
     }
     
     // Caso nuevo cliente (no registrado)
     return {
        idCliente: null,
        ruc: ruc,
        razonSocial: "",
        direccionFiscal: "",
        tipo: "JURIDICA",
        esNuevo: true,
        // defaults
        dniCliente: "",
        nombreCliente: "",
        apellidoCliente: "",
        fechaNacimiento: null,
        esPep: false,
        correoCliente: "",
        telefonoCliente: "",
        direccionCliente: "",
     };
  },

  getDetailsByDNI: async (dni: string): Promise<ClientDetail> => {
    const response = await fetch(
      `${API_BASE_URL}/api/clientes/detalles/${dni}`
    );
    if (!response.ok)
      throw new Error("No se pudieron obtener los detalles del cliente");
    const data = await response.json();
    return {
      ...data,
      tipo: data.tipo || "NATURAL", // Asegurar que tenga tipo
    };
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
