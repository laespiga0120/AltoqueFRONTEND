const API_BASE = import.meta.env.VITE_API_URL || 'https://al-toque-d0b27cb5aec4.herokuapp.com';

// Función auxiliar para obtener token de cualquier lugar posible
const getToken = (): string | null => {
  return localStorage.getItem('token') || 
         localStorage.getItem('authToken') ||
         null;
};

export const comprobanteService = {
  
  // Descargar PDF
  downloadComprobante: async (pagoId: number, tipo: 'BOLETA' | 'FACTURA'): Promise<Blob> => {
    const endpoint = tipo === 'FACTURA' ? 'factura' : 'boleta';
    const token = getToken();

    if (!token) throw new Error("No hay sesión activa.");

    const response = await fetch(`${API_BASE}/api/comprobantes/${endpoint}/${pagoId}?accion=descargar`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
        throw new Error("Error al descargar el archivo.");
    }
    return await response.blob();
  },

  // Enviar correo (CORREGIDO: Tolera respuestas vacías del backend)
  enviarComprobante: async (pagoId: number, tipo: 'BOLETA' | 'FACTURA', email: string): Promise<void> => {
    const endpoint = tipo === 'FACTURA' ? 'factura' : 'boleta';
    const token = getToken();

    if (!token) throw new Error("Sesión expirada");

    const response = await fetch(`${API_BASE}/api/comprobantes/${endpoint}/${pagoId}?accion=correo&emailDestino=${encodeURIComponent(email)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
        throw new Error("Error al procesar el envío.");
    }

    // AQUI ESTABA EL ERROR ANTES:
    // No intentamos hacer response.json() porque el backend devuelve vacío.
    // Simplemente si llegamos aquí, es un éxito (Status 200).
    return; 
  }
};