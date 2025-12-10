import apiClient from './apiClient';
import { ClientAccount, PagoRequest, PagoResponse } from '@/types/operations';

export const operationsService = {
  // 1. Obtener estado de cuenta (Funcionalidad existente recuperada)
  // Llama al endpoint GET /api/operaciones/estado-cuenta/cliente/{id}
  getAccountStatusByClient: async (clientId: number): Promise<ClientAccount> => {
    const response = await apiClient<ClientAccount>(`/api/operaciones/estado-cuenta/cliente/${clientId}`);
    return response;
  },

  // 2. Procesar pago (Nueva funcionalidad con Caja)
  // Llama al endpoint POST /api/operaciones/procesar-pago
  processPayment: async (data: PagoRequest): Promise<PagoResponse> => {
    const response = await apiClient<PagoResponse>('/api/operaciones/procesar-pago', {
      method: 'POST',
      body: data, 
    });
    return response;
  }
};