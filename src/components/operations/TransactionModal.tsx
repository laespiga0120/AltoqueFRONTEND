import { useState } from 'react';
import {
    Banknote, Smartphone, Printer, Mail, CheckCircle2, RotateCcw, Receipt, CreditCard
} from 'lucide-react';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClientAccount, PaymentMethod, PaymentResponse } from '@/types/operations';
import { formatCurrency, calculateRounding} from '@/lib/operationsData';
import { cn } from '@/lib/utils';
import { operationsService } from '@/api/operationsService';

interface TransactionModalProps {
    open: boolean;
    onClose: () => void;
    account: ClientAccount;
    onSuccess: () => void;
}

type Step = 'input' | 'success';

export function TransactionModal({ open, onClose, account, onSuccess }: TransactionModalProps) {
    const [step, setStep] = useState<Step>('input');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<PaymentMethod>('EFECTIVO');
    const [processing, setProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);

    const totalPendingDebt = account.deudaPendienteTotal;
    const parsedAmount = parseFloat(amount) || 0;
    
    // Cálculo de redondeo (visual)
    const { adjustment, rounded } = calculateRounding(parsedAmount);
    const isCash = method === 'EFECTIVO';

    // Sugerencias de montos
    const suggestedAmounts = [
        { label: 'Deuda Total', value: totalPendingDebt },
    ].filter(s => s.value > 0);
    
    // Buscar la cuota más antigua pendiente para sugerir su pago
    // Usamos 'totalAPagar' que viene calculado del backend (capital + mora)
    const currentInstallment = account.cuotas.find(c => c.totalAPagar > 0);
    if (currentInstallment) {
        suggestedAmounts.unshift({ label: 'Cuota Actual', value: currentInstallment.totalAPagar });
    }

    const handleProcess = async () => {
        if (parsedAmount <= 0) {
            toast.error('Ingrese un monto válido');
            return;
        }
        if (parsedAmount > totalPendingDebt + 0.5) { 
            toast.error('El monto excede la deuda total');
            return;
        }

        setProcessing(true);
        try {
            const response = await operationsService.processPayment({
                prestamoId: account.prestamoId,
                monto: parsedAmount,
                metodoPago: method
            });

            setPaymentResult(response);
            setStep('success');
            toast.success('Pago registrado correctamente');
            onSuccess(); 
        } catch (error) {
            console.error(error);
            toast.error('Error procesando pago', { description: 'Verifique su conexión.' });
        } finally {
            setProcessing(false);
        }
    };

    const handleNewOperation = () => {
        setStep('input');
        setAmount('');
        setMethod('EFECTIVO');
        setPaymentResult(null);
        onClose();
    };

    const handleClose = () => {
        if (step === 'success') handleNewOperation();
        else onClose();
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg bg-card">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        {step === 'input' ? 'Procesar Pago' : 'Transacción Exitosa'}
                    </DialogTitle>
                </DialogHeader>

                {step === 'input' ? (
                    <div className="space-y-6">
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                            <p className="font-semibold text-lg">{account.clienteNombre}</p>
                            <p className="text-sm text-muted-foreground">{account.documento}</p>
                            <p className="text-sm font-mono mt-2">
                                Deuda Total: <span className="font-bold text-destructive">{formatCurrency(totalPendingDebt)}</span>
                            </p>
                        </div>

                        <Tabs value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                            <TabsList className="grid w-full grid-cols-4 h-12">
                                <TabsTrigger value="EFECTIVO"><Banknote className="h-4 w-4 mr-2"/>Efectivo</TabsTrigger>
                                <TabsTrigger value="YAPE"><Smartphone className="h-4 w-4 mr-2"/>Yape</TabsTrigger>
                                <TabsTrigger value="PLIN"><Smartphone className="h-4 w-4 mr-2"/>Plin</TabsTrigger>
                                <TabsTrigger value="TARJETA"><CreditCard className="h-4 w-4 mr-2"/>Tarjeta</TabsTrigger>
                            </TabsList>

                            <TabsContent value={method} className="mt-4 space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-base font-semibold">Monto a Pagar</Label>
                                    <Input
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-14 text-2xl font-mono font-bold text-center"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                <div className="flex flex-wrap gap-2">
                                    {suggestedAmounts.map((s) => (
                                        <Badge
                                            key={s.label}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground py-2 px-3"
                                            onClick={() => setAmount(s.value.toFixed(2))}
                                        >
                                            {s.label}: {formatCurrency(s.value)}
                                        </Badge>
                                    ))}
                                </div>

                                {isCash && parsedAmount > 0 && (
                                    <div className="p-4 rounded-xl bg-secondary/50 border-2 border-dashed border-border space-y-3 font-mono text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground font-sans text-sm font-semibold">
                                            <Receipt className="h-4 w-4"/> Simulación de Cobro
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Subtotal:</span><span>{formatCurrency(parsedAmount)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span>Redondeo:</span>
                                            <span className={adjustment < 0 ? 'text-destructive' : 'text-green-600'}>
                                                {adjustment >= 0 ? '+' : ''}{formatCurrency(adjustment)}
                                            </span>
                                        </div>
                                        <div className="border-t pt-2 flex justify-between font-bold text-lg text-primary">
                                            <span>A Cobrar:</span><span>{formatCurrency(rounded)}</span>
                                        </div>
                                    </div>
                                )}

                                <Button
                                    onClick={handleProcess}
                                    disabled={processing || parsedAmount <= 0}
                                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent"
                                >
                                    {processing ? 'Procesando...' : 'Confirmar Pago'}
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 rounded-full bg-green-100 mb-4">
                                <CheckCircle2 className="h-16 w-16 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-600">¡Pago Exitoso!</h3>
                        </div>

                        {paymentResult && (
                            <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2 font-mono text-sm">
                                <div className="flex justify-between">
                                    <span>Monto Aplicado:</span>
                                    <span className="font-bold text-primary">{formatCurrency(paymentResult.montoAplicado)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Deuda Restante:</span>
                                    <span className="font-bold text-destructive">{formatCurrency(paymentResult.deudaRestante)}</span>
                                </div>
                                {paymentResult.detallesCobertura.length > 0 && (
                                    <div className="mt-4 pt-4 border-t border-border/50">
                                        <p className="font-sans font-semibold mb-2 text-xs text-muted-foreground">DETALLE:</p>
                                        <ul className="list-disc list-inside space-y-1 text-xs text-muted-foreground">
                                            {paymentResult.detallesCobertura.map((line, idx) => (
                                                <li key={idx}>{line}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-3">
                            <Button onClick={() => window.print()} variant="outline" size="lg" className="gap-2">
                                <Printer className="h-5 w-5"/> Imprimir Voucher
                            </Button>
                            <Button onClick={() => toast.success('Enviado')} variant="outline" size="lg" className="gap-2">
                                <Mail className="h-5 w-5"/> Enviar por Correo
                            </Button>
                            <Button onClick={handleNewOperation} size="lg" className="bg-gradient-to-r from-primary to-accent text-white gap-2">
                                <RotateCcw className="h-5 w-5"/> Nueva Operación
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}