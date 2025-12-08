import { Loan } from "../types/loan";

// Definición segura de la URL Base
const API_BASE_URL = "http://localhost:8080";

// Interfaz para el mapeo del cronograma desde el backend
interface CuotaDto {
  idCuota: number;
  numeroCuota: number;
  fechaVencimiento: string;
  montoProgramado: number;
  estado: string;
  montoPagado: number;
  interesMora: number;
  totalExigible: number;
}

// Interfaz adaptada para el frontend (compatible con tu PaymentInstallment)
export interface PaymentInstallment {
  installmentNumber: number;
  dueDate: string;
  amount: number;
  state: string; // Agregamos estado para visualización futura
}

export const loanService = {
  // Obtener todos los préstamos
  getAllLoans: async (): Promise<Loan[]> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos`);
    if (!response.ok) throw new Error("Error al obtener los préstamos");
    return response.json();
  },

  // Obtener préstamo por ID
  getLoanById: async (id: string): Promise<Loan> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/${id}`);
    if (!response.ok) throw new Error("Error al obtener el préstamo");
    return response.json();
  },

  // Registrar préstamo
  registerLoan: async (loanData: any): Promise<Loan> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/registro`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(loanData),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al registrar el préstamo");
    }
    return response.json();
  },

  // --- NUEVO: Obtener Cronograma desde Backend ---
  getSchedule: async (loanId: number): Promise<PaymentInstallment[]> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/${loanId}/cronograma`);
    if (!response.ok) {
        if(response.status === 204) return [];
        throw new Error("Error al obtener el cronograma");
    }
    
    const data: CuotaDto[] = await response.json();
    
    // Mapeamos el DTO del backend a la interfaz que usa tu vista
    return data.map(cuota => ({
        installmentNumber: cuota.numeroCuota,
        dueDate: cuota.fechaVencimiento,
        amount: cuota.montoProgramado, // O totalExigible si prefieres mostrar con mora
        state: cuota.estado
    }));
  },

  // Descargar Contrato (Endpoint Backend)
  downloadContractPdf: async (loanId: number, dni?: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/${loanId}/contrato-pdf`);
    if (!response.ok) throw new Error("Error al generar el contrato");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Contrato_Prestamo_${dni || loanId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  },

  // Descargar Cronograma (Endpoint Backend)
  downloadSchedulePdf: async (loanId: number, dni?: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/${loanId}/cronograma-pdf`);
    if (!response.ok) throw new Error("Error al generar el cronograma");
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Cronograma_Pagos_${dni || loanId}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }
};