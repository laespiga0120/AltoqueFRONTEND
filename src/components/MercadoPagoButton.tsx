import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Loader2, CreditCard } from "lucide-react";
import { toast } from 'sonner';
import { authService } from '@/api/authService';
import { initMercadoPago, Wallet } from '@mercadopago/sdk-react';

interface MercadoPagoButtonProps {
  loanId: number;
  amount: number;
  clientName: string;
  disabled?: boolean;
}

export const MercadoPagoButton = ({ loanId, amount, clientName, disabled }: MercadoPagoButtonProps) => {
  const [loading, setLoading] = useState(false);
  const [preferenceId, setPreferenceId] = useState<string | null>(null);

  // Inicializar con tu PUBLIC KEY de PRODUCCIÓN
  useEffect(() => {
    initMercadoPago('APP_USR-f13ef2eb-b631-4ea2-ad78-6ccd52b7f350', {
        locale: 'es-PE' 
    });
  }, []);

  useEffect(() => {
    setPreferenceId(null);
  }, [amount, loanId]);

  const handleGeneratePreference = async () => {
    try {
      setLoading(true);
      
      // URL de producción
      const API_URL = import.meta.env.VITE_API_URL || 'https://al-toque-d0b27cb5aec4.herokuapp.com/api';
      
      let token = authService.getToken();
      if (!token) {
        toast.error("Sesión expirada");
        return;
      }
      token = token.replace(/"/g, '').trim();

      const payload = {
        prestamoId: loanId,
        monto: amount,
        metodoPago: "MERCADO_PAGO",
        descripcion: `Cuota Préstamo #${loanId} - ${clientName}`
      };

      console.log('📤 Enviando solicitud:', payload);

      const response = await fetch(`${API_URL}/pagos/crear-preferencia`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify(payload)
      });

      const responseText = await response.text();
      console.log('📥 Respuesta raw:', responseText);

      if (!response.ok) {
        let errorMessage = "Error al generar preferencia";
        try {
          const errorData = JSON.parse(responseText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parseando respuesta de error:', e);
        }
        throw new Error(errorMessage);
      }

      let data;
      try {
        data = JSON.parse(responseText);
        console.log('✅ Datos parseados:', data);
      } catch (parseError) {
        console.error('❌ Error parseando JSON:', parseError);
        throw new Error('Respuesta inválida del servidor');
      }
      
      if (data.preferenceId) {
        setPreferenceId(data.preferenceId);
        toast.success("Redirigiendo a Mercado Pago...");
      } else {
        throw new Error('No se recibió el ID de preferencia');
      }

    } catch (error: any) {
      console.error("❌ Error completo:", error);
      toast.error(error.message || "Error al conectar con Mercado Pago");
    } finally {
      setLoading(false);
    }
  };
  if (preferenceId) {
    return (
        <div className="w-full animate-in fade-in zoom-in duration-300">
            <div className="my-2">
                <Wallet 
                    initialization={{ preferenceId: preferenceId }}
                />
            </div>
            <Button 
                variant="ghost" 
                size="sm" 
                className="w-full text-xs text-muted-foreground h-auto py-1 hover:text-red-500"
                onClick={() => setPreferenceId(null)}
            >
                Cancelar / Cambiar monto
            </Button>
        </div>
    );
  }
  

  return (
    <Button 
      onClick={handleGeneratePreference} 
      disabled={loading || disabled || amount <= 0}
      className="w-full h-12 text-base font-bold bg-[#009EE3] hover:bg-[#0081B9] text-white shadow-sm transition-all gap-2"
    >
      {loading ? (
        <Loader2 className="h-5 w-5 animate-spin" />
      ) : (
        <CreditCard className="h-5 w-5" />
      )}
      {loading ? 'Cargando...' : 'Pagar con Mercado Pago'}
    </Button>
  );
};

export default MercadoPagoButton;