import { ClientDetail } from "./client";

// DTO para registrar un nuevo préstamo (Payload al backend)
export interface LoanDto {
  idCliente: number;
  monto: number;
  tasaInteresAnual: number;
  numeroCuotas: number;
  fechaPrestamo: string;
}

// Estructura completa de un préstamo (Respuesta del backend)
export interface Loan {
  idPrestamo: number;
  cliente: ClientDetail; // Contiene datos anidados del cliente
  
  monto: number;
  tasaInteresAnual: number;
  numeroCuotas: number;
  fechaPrestamo: string;
  estado: string;
  
  // Flags de documentos
  declaracionImpresa?: boolean;
  declaracionPepImpresa?: boolean;
}

// Estructura para el envío de correos
export interface EmailRequest {
  clienteId: number;
  prestamoId: number;
  emailDestino?: string;
}

// Representa una cuota del cronograma (para la tabla de visualización)
export interface PaymentInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  state: string;
}