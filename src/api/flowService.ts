import { API_BASE_URL } from './apiClient';
import { FlowCreatePaymentRequest, FlowCreatePaymentResponse } from '../types/flow';

export interface FlowValidationResponse {
    status: 'SUCCESS' | 'FAILURE' | 'PENDING' | 'UNKNOWN';
    flowOrder: string;
    paymentId?: number;
    amount?: number;
    error?: {
        code: string;
        message: string;
    };
}

export const flowService = {
    /**
     * Inicia una transacción de pago con Flow.
     * CORRECCIÓN: Se agrega '/api' al path para coincidir con el Controller Backend.
     */
    createPayment: async (data: FlowCreatePaymentRequest): Promise<FlowCreatePaymentResponse> => {
        const response = await fetch(`${API_BASE_URL}/api/flow/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}` 
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData || 'Error al iniciar pago con Flow');
        }

        return await response.json();
    },

    /**
     * Valida el token de pago retornado por Flow.
     * CORRECCIÓN: Se agrega '/api' al path.
     */
    validatePayment: async (token: string): Promise<FlowValidationResponse> => {
        const response = await fetch(`${API_BASE_URL}/api/flow/status?token=${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
        });

        if (!response.ok) {
            throw new Error('Error validando el pago con el servidor');
        }

        return await response.json();
    }
};