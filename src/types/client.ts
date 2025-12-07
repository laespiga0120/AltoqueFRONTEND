/**

Representa la información resumida del cliente que se obtiene en la búsqueda inicial del Dashboard.

Corresponde al DTO ClienteConsultaDto del backend.
*/
export interface ClientSummary {
  dniCliente: string;
  nombreCliente: string;
  apellidoCliente: string;
  tienePrestamoActivo: boolean;
}

/**

Representa la información detallada del cliente para el formulario de registro/préstamo.

Corresponde al DTO ClienteDetalleDto del backend.
*/
export interface ClientDetail {
  idCliente: String | null; // Puede ser null para nuevos clientes
  dniCliente: string;
  nombreCliente: string;
  apellidoCliente: string;
  fechaNacimiento: string | null; // El backend puede enviarlo como string (ISO format)
  esPep: boolean | null;
  correoCliente: string | null;
  telefonoCliente: string | null;
  direccionCliente: string | null;
  esNuevo: boolean; // Flag para controlar la UI
}
