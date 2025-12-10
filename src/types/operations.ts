// --- DTOs del Backend (Coinciden con Java) ---

export type PaymentMethod = 'EFECTIVO' | 'ELECTRONICO';

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
  tipoCliente: string;
  clienteNombre: string;
  razonSocial: string;
  documento: string; // DNI o RUC
  deudaOriginalTotal: number;
  deudaPendienteTotal: number;
  cuotas: AccountInstallment[];
}

export interface PagoRequest {
  prestamoId: number;
  monto: number;       // BigDecimal en Java
  metodoPago: string;  // String en Java
  descripcion: string; // String en Java
}

export interface PagoResponse {
  id: number;
  status: string;
  statusDetail: string;
  mensaje: string;
  montoAplicado: number;
  deudaRestante?: number;
  detallesCobertura: string[];
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

// --- DTOs de Caja (Backend Java) ---

export interface Caja {
  idCaja: number;
  idUsuario: number;
  fechaApertura: string;
  fechaCierre?: string;
  saldoInicial: number;
  totalEfectivoSistema: number;
  totalDigitalSistema: number;
  totalAjusteRedondeo: number;
  saldoFinalEsperado: number;
  saldoFinalReal?: number;
  estado: 'ABIERTA' | 'CERRADA';
}

// Interfaz para la tabla visual (Adaptador)
export interface TransactionDisplay {
  id: string;
  timestamp: string;
  clientName: string;
  type: string;
  method: string;
  systemAmount: number;
  roundingAdjustment: number;
  realAmount: number;
}


// NUEVA INTERFAZ PARA LA TABLA
// Mapea la respuesta del endpoint de movimientos
export interface Transaction {
  id: number; // idPago en Java
  timestamp: string; // fechaPago en Java
  clientName: string; // prestamo.cliente.nombre + apellido
  clientDNI: string;  // prestamo.cliente.dni
  type: 'PAGO' | 'APERTURA' | 'CIERRE'; 
  method: string; // "EFECTIVO", "YAPE", "PLIN", "TARJETA"
  systemAmount: number; // montoTotal (lo que se descuenta de la deuda)
  roundingAdjustment: number; // ajusteRedondeo
  realAmount: number; // Lo que entra a caja (montoTotal + ajuste)
}

