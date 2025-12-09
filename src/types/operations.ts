// --- DTOs del Backend (Coinciden con Java) ---

export type PaymentMethod = 'EFECTIVO' | 'YAPE' | 'PLIN' | 'TARJETA';

export interface AccountInstallment {
  id: number;
  numeroCuota: number;
  fechaVencimiento: string; // ISO date 'YYYY-MM-DD'
  cuotaOriginal: number;
  saldoPendiente: number;
  moraGenerada: number;
  estado: string;
  totalAPagar: number;
}

export interface ClientAccount {
  prestamoId: number;
  clienteNombre: string;
  documento: string; // DNI o RUC
  deudaOriginalTotal: number;
  deudaPendienteTotal: number;
  cuotas: AccountInstallment[];
}

export interface PaymentRequest {
  prestamoId: number;
  monto: number;
  metodoPago: PaymentMethod;
}

export interface PaymentResponse {
  mensaje: string;
  montoAplicado: number;
  deudaRestante: number;
  detallesCobertura: string[];
}

// --- Tipos Locales / Caja ---

export interface Transaction {
  id: string;
  timestamp: string;
  clientDNI: string;
  clientName: string;
  type: 'payment' | 'opening' | 'withdrawal';
  method: string;
  systemAmount: number;
  roundingAdjustment: number;
  realAmount: number;
  installmentsPaid: number[];
  operatorId: string;
}

export interface CashRegisterSummary {
  openingBalance: number;
  cashEntries: number;
  roundingAdjustment: number;
  digitalEntries: number;
  theoreticalTotal: number;
  transactions: Transaction[];
  date: string;
  status: 'open' | 'closed';
}