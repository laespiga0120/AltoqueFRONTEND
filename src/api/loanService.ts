import { Loan, LoanDto } from "../types/loan";
import { downloadPdf } from "../utils/downloadHelper";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8080";

export const loanService = {
  getAllLoans: async (): Promise<Loan[]> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/listar`);
    if (!response.ok) {
      throw new Error("No se pudo obtener la lista de préstamos.");
    }
    return response.json();
  },

  registerLoan: async (payload: LoanDto): Promise<Loan> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/registrar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || "Error al registrar el préstamo.");
    }
    return response.json();
  },

  getLoanById: async (id: string): Promise<Loan> => {
    const response = await fetch(`${API_BASE_URL}/api/prestamos/${id}`);
    if (!response.ok) {
      throw new Error("No se pudo encontrar el préstamo.");
    }
    return response.json();
  },

  /**
   * Descarga el contrato de un préstamo en formato PDF.
   */
  downloadContractPdf: async (loanId: number, dni: string): Promise<void> => {
    await downloadPdf(
      `${API_BASE_URL}/api/prestamos/${loanId}/contrato-pdf`,
      `Contrato_Prestamo_${dni}.pdf`
    );
  },

  /**
   * Descarga el cronograma de pagos de un préstamo en formato PDF.
   */
  downloadSchedulePdf: async (loanId: number, dni: string): Promise<void> => {
    await downloadPdf(
      `${API_BASE_URL}/api/prestamos/${loanId}/cronograma-pdf`,
      `Cronograma_Pagos_${dni}.pdf`
    );
  },
};
