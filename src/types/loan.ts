import { ClientDetail } from "./client";

// --- NUEVO TIPO AÑADIDO ---
// Representa el objeto de datos que se envía al backend para crear un préstamo.
// Coincide con el PrestamoDto de Java.
export interface LoanDto {
  idCliente: number;
  monto: number;
  tasaInteresAnual: number;
  numeroCuotas: number;
  fechaPrestamo: string;
}

// Representa la estructura completa de un préstamo que viene del backend
export interface Loan {
  idPrestamo: number;
  cliente: ClientDetail; // El objeto cliente viene anidado
  monto: number;
  tasaInteresAnual: number;
  numeroCuotas: number;
  fechaPrestamo: string;
  estado: string;
}

// Representa la estructura para el envío de correos
export interface EmailRequest {
  clienteId: String;
  prestamoId: number;
  emailDestino?: string; // Opcional
}

// Representa una cuota del cronograma (generado en el frontend por ahora)
export interface PaymentInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
}
