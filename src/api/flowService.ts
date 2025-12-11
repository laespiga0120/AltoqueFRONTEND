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

// Helper para obtener el token correcto según tu configuración (authToken)
const getToken = () => {
    // 1. Prioridad: 'authToken' (Tu configuración actual)
    let token = localStorage.getItem('authToken');
    
    // 2. Fallback: 'token' (Por si acaso cambia en el futuro)
    if (!token) token = localStorage.getItem('token');

    // Limpieza: Si el token viene con comillas extra (JSON.stringify), las quitamos
    if (token && token.startsWith('"') && token.endsWith('"')) {
        token = token.slice(1, -1);
    }

    return token;
};

export const flowService = {
    /**
     * Inicia una transacción de pago con Flow.
     */
    createPayment: async (data: FlowCreatePaymentRequest): Promise<FlowCreatePaymentResponse> => {
        const token = getToken();
        
        if (!token) {
            console.error("❌ Error: No se encontró 'authToken' en LocalStorage.");
            throw new Error('No se encontró sesión activa. Por favor inicie sesión nuevamente.');
        }

        console.log("✅ Iniciando pago Flow. Token detectado.");

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
            console.error("🔥 Error Respuesta Backend Flow:", response.status, errorData);
            try {
                const errorJson = JSON.parse(errorData);
                throw new Error(errorJson.message || errorJson.error || 'Error al iniciar pago');
            } catch (e) {
                // Si el error es HTML (común en errores de servidor/proxy), mostramos mensaje genérico
                throw new Error(`Error del servidor (${response.status}). Revise consola.`);
            }
        }

        return await response.json();
    },

    /**
     * Valida el token de pago retornado por Flow.
     */
    validatePayment: async (token: string): Promise<FlowValidationResponse> => {
        const authToken = getToken();
        
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