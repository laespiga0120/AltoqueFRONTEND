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
    createPayment: async (data: FlowCreatePaymentRequest): Promise<FlowCreatePaymentResponse> => {
        const token = localStorage.getItem('token');
        
        // Validación crítica: Si no hay token, no intentamos la llamada
        if (!token) {
            throw new Error('No se encontró sesión activa. Por favor inicie sesión nuevamente.');
        }

        const response = await fetch(`${API_BASE_URL}/api/flow/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const errorData = await response.text();
            try {
                // Intentar parsear si es JSON
                const errorJson = JSON.parse(errorData);
                throw new Error(errorJson.message || errorJson.error || 'Error al iniciar pago');
            } catch (e) {
                // Si no es JSON, usar texto plano
                throw new Error(errorData || 'Error al iniciar pago con Flow');
            }
        }

        return await response.json();
    },

    validatePayment: async (token: string): Promise<FlowValidationResponse> => {
        const authToken = localStorage.getItem('token');
        // Para validación pública (retorno de Flow), a veces no hay sesión si el usuario cerró el navegador.
        // Pero tu backend /status requiere autenticación. 
        // Si el usuario perdió la sesión, el frontend debería manejarlo (redirigir al login).
        
        const headers: HeadersInit = {
            'Content-Type': 'application/json'
        };

        if (authToken) {
            headers['Authorization'] = `Bearer ${authToken}`;
        }

        const response = await fetch(`${API_BASE_URL}/api/flow/status?token=${token}`, {
            method: 'GET',
            headers: headers,
        });

        if (!response.ok) {
            throw new Error('Error validando el pago con el servidor');
        }

        return await response.json();
    }
};