import { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, ArrowRight, Download, Mail, Loader2, Home } from 'lucide-react';
import { toast } from 'sonner';
import { flowService, FlowValidationResponse } from '@/api/flowService';
import { comprobanteService } from '@/api/comprobantesService';
import { Input } from '@/components/ui/input';

const PaymentStatus = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Estados de carga y datos
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<'SUCCESS' | 'FAILURE' | 'PENDING' | 'UNKNOWN'>('PENDING');
  const [paymentData, setPaymentData] = useState<FlowValidationResponse | null>(null);
  
  // Estados para acciones posteriores (Email/PDF)
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailTarget, setEmailTarget] = useState('');
  
  // Evitar doble ejecución en React StrictMode
  const processedToken = useRef<string | null>(null);

  useEffect(() => {
    const validateTransaction = async () => {
      const queryParams = new URLSearchParams(location.search);
      const token = queryParams.get('token'); // Token de Flow

      if (!token) {
        setLoading(false);
        setStatus('UNKNOWN');
        return;
      }

      if (processedToken.current === token) return;
      processedToken.current = token;

      try {
        setLoading(true);
        const result = await flowService.validatePayment(token);
        setStatus(result.status);
        setPaymentData(result);
        
        if (result.status === 'SUCCESS') {
          toast.success('¡Pago confirmado correctamente!');
        } else if (result.status === 'FAILURE') {
          toast.error(result.error?.message || 'El pago fue rechazado por Flow');
        }
      } catch (error) {
        console.error("Error validando pago:", error);
        setStatus('UNKNOWN');
        toast.error('Error de conexión al validar el pago.');
      } finally {
        setLoading(false);
      }
    };

    validateTransaction();
  }, [location]);

  const handleDownload = async () => {
    if (!paymentData?.paymentId) return;
    const toastId = toast.loading('Generando comprobante PDF...');
    
    try {
      // Asumimos 'BOLETA' por defecto o podrías pasar el tipo si lo guardaste
      const blob = await comprobanteService.downloadComprobante(paymentData.paymentId, 'BOLETA');
      
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Comprobante_Flow_${paymentData.flowOrder}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      
      toast.dismiss(toastId);
      toast.success('Descarga completada');
    } catch (error) {
      console.error("Error PDF:", error);
      toast.dismiss(toastId);
      toast.error('No se pudo descargar el comprobante.');
    }
  };

  const handleSendEmail = async () => {
    if (!paymentData?.paymentId || !emailTarget) {
        toast.error("Ingrese un correo válido");
        return;
    }
    
    setSendingEmail(true);
    try {
        await comprobanteService.enviarComprobante(paymentData.paymentId, 'BOLETA', emailTarget);
        toast.success(`Comprobante enviado a ${emailTarget}`);
    } catch (error) {
        toast.error("Error al enviar el correo");
    } finally {
        setSendingEmail(false);
    }
  };

  // Configuración visual según estado
  const config = {
    SUCCESS: {
      icon: <CheckCircle className="w-20 h-20 text-green-500" />,
      title: "¡Pago Exitoso!",
      description: "Tu transacción ha sido procesada y registrada correctamente.",
      color: "text-green-600",
      bgColor: "bg-green-50 border-green-200"
    },
    FAILURE: {
      icon: <XCircle className="w-20 h-20 text-red-500" />,
      title: "Pago Rechazado",
      description: paymentData?.error?.message 
        ? `Razón: ${paymentData.error.message}` 
        : "Hubo un problema con tu medio de pago. No se ha realizado ningún cargo.",
      color: "text-red-600",
      bgColor: "bg-red-50 border-red-200"
    },
    PENDING: {
      icon: <Clock className="w-20 h-20 text-orange-500" />,
      title: "Procesando...",
      description: "Estamos verificando el estado de tu pago con el banco.",
      color: "text-orange-600",
      bgColor: "bg-orange-50 border-orange-200"
    },
    UNKNOWN: {
      icon: <Clock className="w-20 h-20 text-gray-400" />,
      title: "Estado Desconocido",
      description: "No pudimos verificar la información del pago. Revisa tu historial.",
      color: "text-gray-600",
      bgColor: "bg-gray-50 border-gray-200"
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-md text-center shadow-lg p-8">
                <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                <h2 className="text-xl font-semibold text-gray-700">Validando transacción...</h2>
                <p className="text-gray-500 mt-2">Por favor no cierres esta ventana.</p>
            </Card>
        </div>
    );
  }

  const currentConfig = config[status];

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className={`w-full max-w-md text-center shadow-xl border-t-4 ${status === 'SUCCESS' ? 'border-t-green-500' : 'border-t-red-500'}`}>
        <CardHeader className="pb-2">
          <div className="flex justify-center mb-6 animate-in zoom-in duration-300">
            {currentConfig.icon}
          </div>
          <CardTitle className={`text-3xl font-bold ${currentConfig.color}`}>
            {currentConfig.title}
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <p className="text-gray-600 text-lg">
            {currentConfig.description}
          </p>
          
          {paymentData?.flowOrder && (
            <div className="bg-gray-100 p-3 rounded-lg border border-gray-200 text-sm flex justify-between items-center px-6">
              <span className="text-gray-500">Orden Flow:</span>
              <span className="font-mono font-bold text-gray-800 text-base">{paymentData.flowOrder}</span>
            </div>
          )}

          {/* SECCIÓN DE ACCIONES DE ÉXITO */}
          {status === 'SUCCESS' && paymentData?.paymentId && (
            <div className="space-y-4 pt-4 border-t border-dashed">
                <Button 
                    onClick={handleDownload} 
                    variant="outline" 
                    className="w-full h-12 border-primary/30 hover:bg-primary/5 text-primary font-semibold"
                >
                    <Download className="h-5 w-5 mr-2" /> Descargar Comprobante
                </Button>

                <div className="flex gap-2">
                    <Input 
                        placeholder="Enviar copia a correo..." 
                        value={emailTarget}
                        onChange={(e) => setEmailTarget(e.target.value)}
                        className="text-sm"
                    />
                    <Button 
                        onClick={handleSendEmail}
                        disabled={sendingEmail || !emailTarget}
                        className="shrink-0"
                    >
                        {sendingEmail ? <Loader2 className="h-4 w-4 animate-spin"/> : <Mail className="h-4 w-4"/>}
                    </Button>
                </div>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-3 pt-2">
          <Button 
            className="w-full h-12 text-lg shadow-md bg-gradient-to-r from-gray-800 to-gray-900 hover:from-black hover:to-gray-800" 
            onClick={() => navigate('/dashboard')}
          >
            <Home className="w-5 h-5 mr-2" /> Volver al Inicio
          </Button>
          
          {status === 'FAILURE' && (
             <Button variant="ghost" className="text-sm text-muted-foreground" onClick={() => navigate('/loans/new')}>
                Intentar otra operación
             </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentStatus;