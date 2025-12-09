import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';

interface PaymentStatusProps {
  status: 'success' | 'failure' | 'pending';
}

const PaymentStatus = ({ status }: PaymentStatusProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [paymentId, setPaymentId] = useState<string>("");

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const id = queryParams.get('payment_id');
    if (id) setPaymentId(id);
  }, [location]);

  const config = {
    success: {
      icon: <CheckCircle className="w-16 h-16 text-green-500" />,
      title: "¡Pago Exitoso!",
      description: "Tu transacción ha sido procesada correctamente.",
      color: "text-green-600",
      buttonText: "Volver a Préstamos"
    },
    failure: {
      icon: <XCircle className="w-16 h-16 text-red-500" />,
      title: "Pago Rechazado",
      description: "Hubo un problema al procesar tu pago. Por favor, intenta nuevamente.",
      color: "text-red-600",
      buttonText: "Intentar Nuevamente"
    },
    pending: {
      icon: <Clock className="w-16 h-16 text-orange-500" />,
      title: "Pago Pendiente",
      description: "Estamos procesando tu pago. Te notificaremos cuando se complete.",
      color: "text-orange-600",
      buttonText: "Volver al Inicio"
    }
  };

  const currentConfig = config[status];

  return (
    <div className="flex items-center justify-center min-h-[80vh] w-full">
      <Card className="w-full max-w-md text-center shadow-lg">
        <CardHeader>
          <div className="flex justify-center mb-4">
            {currentConfig.icon}
          </div>
          <CardTitle className={`text-2xl font-bold ${currentConfig.color}`}>
            {currentConfig.title}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            {currentConfig.description}
          </p>
          {paymentId && (
            <div className="bg-gray-100 p-2 rounded text-sm text-gray-500">
              ID de Operación: <span className="font-mono font-medium text-gray-700">{paymentId}</span>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center">
          <Button 
            className="w-full gap-2" 
            onClick={() => navigate('/dashboard')}
          >
            {currentConfig.buttonText}
            <ArrowRight className="w-4 h-4" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PaymentStatus;