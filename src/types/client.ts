// src/types/client.ts

// Usado en el Dashboard (Resultados de búsqueda)
export interface ClientSummary {
    dniCliente?: string; // Opcional, puede ser RUC
    ruc?: string;        // Opcional, puede ser DNI
    razonSocial?: string;
    nombreCliente?: string;
    apellidoCliente?: string;
    tipo: "NATURAL" | "JURIDICA";
    tienePrestamoActivo: boolean;
}

// Usado en el Formulario de Préstamo (Detalles completos)
export interface ClientDetail {
    idCliente: number | null; // Null si es nuevo
    tipo: "NATURAL" | "JURIDICA";
    esNuevo: boolean;

    // Datos Persona Natural
    dniCliente?: string;
    nombreCliente?: string;
    apellidoCliente?: string;
    fechaNacimiento?: string; // ISO String (YYYY-MM-DD)
    esPep?: boolean;

    // Datos Persona Jurídica
    ruc?: string;
    razonSocial?: string;
    direccionFiscal?: string;
    fechaConstitucion?: string; // ISO String
    representanteLegalDni?: string;
    representanteLegalNombre?: string;

    // Datos de Contacto Comunes
    correoCliente: string;
    telefonoCliente: string;
    direccionCliente: string;
}