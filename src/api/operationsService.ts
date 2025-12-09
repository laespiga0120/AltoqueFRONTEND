import apiClient from './apiClient';
import { ClientAccount, PaymentRequest, PaymentResponse } from '@/types/operations';

export const operationsService = {
  // Obtener estado de cuenta REAL por ID de cliente
  getAccountStatusByClient: async (clientId: number): Promise<ClientAccount> => {
    const response = await apiClient<ClientAccount>(`/api/operaciones/estado-cuenta/cliente/${clientId}`);
    return response;
  },

  // Procesar un pago REAL
  processPayment: async (data: PaymentRequest): Promise<PaymentResponse> => {
    const response = await apiClient<PaymentResponse>('/api/operaciones/procesar-pago', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      // Envío directo del objeto
      body: data, 
    });
    return response;
  }
};