export interface FlowCreatePaymentRequest {
    commerceOrder: string; // ID interno (ej. PrestamoID + Timestamp)
    subject: string;       // Concepto
    amount: number;        // Monto
    email: string;         // Email del pagador
    urlReturn: string;     // URL de retorno al frontend
}

export interface FlowCreatePaymentResponse {
    url: string;           // URL base de Flow
    token: string;         // Token de transacción
    flowOrder: string;     // Orden de Flow
    redirectUrl: string;   // URL completa helper (url + token)
}