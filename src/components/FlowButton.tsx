import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { flowService } from '@/api/flowService';

interface FlowButtonProps {
    loanId: number;
    amount: number;
    clientName: string;
    clientEmail: string;
    description: string;
    disabled?: boolean;
}

export function FlowButton({ 
    loanId, 
    amount, 
    clientEmail, 
    description, 
    disabled 
}: FlowButtonProps) {
    const [loading, setLoading] = useState(false);

    const handlePayment = async () => {
        if (amount <= 0) return;

        setLoading(true);
        try {
            // Generamos un ID de orden único combinando el préstamo y la fecha
            // para evitar colisiones si reintentan el pago.
            const uniqueOrderId = `LOAN-${loanId}-${Date.now()}`;
            
            // La URL a la que Flow devolverá al usuario
            // Asumimos que tienes una ruta /payment-status configurada
            const returnUrl = `${window.location.origin}/payment-status`;

            const response = await flowService.createPayment({
                commerceOrder: uniqueOrderId,
                subject: description,
                amount: amount,
                email: clientEmail || 'cliente@generico.com', // Flow exige email
                urlReturn: returnUrl
            });

            // Redirección total del navegador a la pasarela segura de Flow
            window.location.href = response.redirectUrl;

        } catch (error) {
            console.error('Flow Payment Error:', error);
            toast.error('No se pudo iniciar la pasarela de pagos. Intente nuevamente.');
            setLoading(false);
        }
    };

    return (
        <div className="w-full space-y-3">
            <div className="flex flex-col items-center justify-center p-6 border-2 border-blue-100 dark:border-blue-900 rounded-lg bg-white dark:bg-black/20">
                <img 
                    src="https://www.flow.cl/images/header/logo-flow.svg" 
                    alt="Flow Pagos" 
                    className="h-8 mb-4"
                    onError={(e) => {
                        // Fallback simple por si la imagen falla
                        e.currentTarget.style.display = 'none';
                    }}
                />
                <p className="text-sm text-center text-muted-foreground mb-4">
                    Serás redirigido a la pasarela segura de Flow (WebPay, Servipag, etc.)
                </p>
                
                <Button 
                    onClick={handlePayment} 
                    disabled={disabled || loading}
                    className="w-full bg-[#1A428A] hover:bg-[#15346E] text-white h-12 text-lg font-semibold shadow-lg transition-all"
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            Conectando...
                        </>
                    ) : (
                        <>
                            Pagar con Flow <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                    )}
                </Button>
            </div>
            <div className="text-xs text-center text-muted-foreground">
                Transacción protegida con encriptación SSL bancaria.
            </div>
        </div>
    );
}