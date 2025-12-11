import { useState, useEffect } from 'react';
import {
    Banknote,
    Mail,
    CheckCircle2,
    RotateCcw,
    Receipt,
    Globe,
    Download,
    Loader2,
    AlertCircle
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
import { ClientAccount, PagoResponse, PagoRequest } from '@/types/operations';
import { formatCurrency, calculateRounding} from '@/lib/operationsData';
import { operationsService } from '@/api/operationsService';
import { FlowButton } from '@/components/FlowButton';
import { comprobanteService } from '@/api/comprobantesService';

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
    const [tab, setTab] = useState<string>('EFECTIVO');
    
    // Estados de éxito
    const [processing, setProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PagoResponse | null>(null);
    const [sendingEmail, setSendingEmail] = useState(false);
    
    // Inicialización del correo
    const [targetEmail, setTargetEmail] = useState(account?.correo || '');

    useEffect(() => {
        if (account?.correo) {
            setTargetEmail(account.correo);
        } else {
            setTargetEmail('');
        }
    }, [account]);

    const totalPendingDebt = account?.deudaPendienteTotal || 0;
    const parsedAmount = parseFloat(amount) || 0;
    const { adjustment, rounded } = calculateRounding(parsedAmount);

    const docType = account?.tipoCliente === 'JURIDICA' ? 'FACTURA' : 'BOLETA';

    // CONSTANTE DE NEGOCIO FLOW (SOLES)
    const MIN_FLOW_AMOUNT = 2.00;

    const suggestedAmounts = [
        { label: 'Deuda Total', value: totalPendingDebt },
    ].filter(s => s.value > 0);
    
    const currentInstallment = account?.cuotas?.find(c => c.totalAPagar > 0);
    if (currentInstallment) {
        suggestedAmounts.unshift({ label: `Cuota ${currentInstallment.numeroCuota}`, value: currentInstallment.totalAPagar });
    }

    const handleCashProcess = async () => {
        if (parsedAmount <= 0) {
            toast.error('Ingrese un monto válido');
            return;
        }

        if (parsedAmount > totalPendingDebt) {
            toast.error('El monto a pagar no puede ser mayor a la deuda total');
            return;
        }

        setProcessing(true);
        try {
            const requestPayload: PagoRequest = {
                prestamoId: account.prestamoId,
                monto: parsedAmount,
                metodoPago: 'EFECTIVO',
                descripcion: `Pago en efectivo - ${account.clienteNombre}`
            };

            const response = await operationsService.processPayment(requestPayload);

            setPaymentResult(response);
            setStep('success');
            toast.success('Pago registrado correctamente');
            
        } catch (error) {
            console.error(error);
            toast.error('Error procesando el pago. Intente nuevamente.');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendEmail = async () => {
        if (!paymentResult?.idPago) return;
        
        if (!targetEmail || !targetEmail.includes('@')) {
            toast.error('Por favor ingrese un correo válido.');
            return;
        }
        
        setSendingEmail(true);
        try {
            await comprobanteService.enviarComprobante(paymentResult.idPago, docType, targetEmail);
            toast.success(`Comprobante enviado a ${targetEmail}`);
        } catch (error) {
            console.error("Error envío correo:", error);
            toast.error('Error al enviar correo. Verifique la conexión.');
        } finally {
            setSendingEmail(false);
        }
    };

    const handleDownload = async () => {
        if (!paymentResult?.idPago) return;
        const toastId = toast.loading('Generando documento...');
        
        try {
            const blob = await comprobanteService.downloadComprobante(paymentResult.idPago, docType);
            
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `${docType}_${paymentResult.idPago}.pdf`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
            
            toast.dismiss(toastId);
            toast.success('Descarga completada');
        } catch (error: any) {
            console.error("Error descarga PDF:", error);
            toast.dismiss(toastId);
            toast.error(error.message || 'Error al descargar el archivo');
        }
    };

    const handleNewOperation = () => {
        setStep('input');
        setAmount('');
        setTab('EFECTIVO');
        setPaymentResult(null);
        setSendingEmail(false);
        setTargetEmail(account.correo || ''); 
        onSuccess(); 
    };

    const handleClose = () => {
        if (step === 'success') handleNewOperation();
        else onClose();
    };

    if (!account) return null;

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
                            <p className="font-semibold text-lg">
                                {account.tipoCliente === 'NATURAL' ? account.clienteNombre : account.razonSocial}
                            </p>
                            <p className="text-sm text-muted-foreground">{account.documento}</p>
                            <p className="text-sm font-mono mt-2">
                                Deuda Total: <span className="font-bold text-destructive">{formatCurrency(totalPendingDebt)}</span>
                            </p>
                        </div>

                        <Tabs value={tab} onValueChange={setTab}>
                            <TabsList className="grid w-full grid-cols-2 h-12">
                                <TabsTrigger value="EFECTIVO">
                                    <Banknote className="h-4 w-4 mr-2"/>
                                    Efectivo
                                </TabsTrigger>
                                <TabsTrigger value="ONLINE">
                                    <Globe className="h-4 w-4 mr-2"/>
                                    Online (Flow)
                                </TabsTrigger>
                            </TabsList>

                            <div className="mt-4 space-y-4">
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
                            </div>

                            <TabsContent value="EFECTIVO" className="space-y-4 mt-4">
                                {parsedAmount > 0 && (
                                    <div className="p-4 rounded-xl bg-secondary/50 border-2 border-dashed border-border space-y-3 font-mono text-sm">
                                        <div className="flex items-center gap-2 text-muted-foreground font-sans text-sm font-semibold">
                                            <Receipt className="h-4 w-4"/> Simulación Caja
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
                                    onClick={handleCashProcess}
                                    disabled={processing || parsedAmount <= 0}
                                    className="w-full h-12 text-lg font-bold"
                                >
                                    {processing ? 'Procesando...' : 'Cobrar Efectivo'}
                                </Button>
                            </TabsContent>

                            <TabsContent value="ONLINE" className="space-y-4 mt-4">
                                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900">
                                    <p className="text-sm text-center text-blue-600 dark:text-blue-400 mb-2">
                                        Pasarela de pagos segura
                                    </p>
                                    
                                    {/* CAMBIO: Usamos targetEmail que es editable, o un fallback seguro */}
                                    <FlowButton 
                                        loanId={account.prestamoId}
                                        amount={parsedAmount}
                                        clientName={account.clienteNombre}
                                        clientEmail={targetEmail && targetEmail.includes('@') ? targetEmail : 'pagos@altoque.pe'} 
                                        description={`Pago Cuota - ${account.clienteNombre}`}
                                        disabled={parsedAmount < MIN_FLOW_AMOUNT || parsedAmount > totalPendingDebt}
                                    />
                                    
                                    {/* Mensaje de alerta visual si el monto es insuficiente */}
                                    {parsedAmount > 0 && parsedAmount < MIN_FLOW_AMOUNT && (
                                        <div className="flex items-center justify-center gap-2 text-xs text-amber-600 mt-2 font-medium">
                                            <AlertCircle className="h-4 w-4" />
                                            <span>Monto mínimo para Flow: {formatCurrency(MIN_FLOW_AMOUNT)}</span>
                                        </div>
                                    )}

                                    {/* Input de correo opcional para Flow si no tiene */}
                                    {(!account.correo || account.correo.trim() === '') && (
                                        <div className="mt-2">
                                            <Label className="text-xs">Correo para comprobante (Flow)</Label>
                                            <Input 
                                                value={targetEmail}
                                                onChange={(e) => setTargetEmail(e.target.value)}
                                                placeholder="cliente@email.com"
                                                className="h-8 text-sm mt-1"
                                            />
                                        </div>
                                    )}
                                    
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    // --- VISTA DE ÉXITO (Solo para Efectivo) ---
                    <div className="space-y-6 py-4 animate-in fade-in zoom-in-95 duration-300">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 rounded-full bg-green-100 mb-4">
                                <CheckCircle2 className="h-16 w-16 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-600">¡Pago Registrado!</h3>
                            <p className="text-muted-foreground">
                                Se ha generado {docType === 'FACTURA' ? 'la Factura' : 'la Boleta'} electrónica.
                            </p>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <Button onClick={handleDownload} variant="outline" className="w-full h-12 border-primary/20 hover:bg-primary/5">
                                <Download className="h-5 w-5 mr-2 text-primary"/> Descargar Comprobante
                            </Button>
                        </div>
                        
                        <div className="bg-secondary/20 p-4 rounded-lg space-y-3">
                            <div className="space-y-2">
                                <Label className="text-xs font-semibold uppercase text-muted-foreground">Enviar copia por correo</Label>
                                <div className="flex gap-2">
                                    <Input 
                                        placeholder="correo@ejemplo.com" 
                                        value={targetEmail}
                                        onChange={(e) => setTargetEmail(e.target.value)}
                                        className="bg-background"
                                    />
                                    <Button 
                                        onClick={handleSendEmail} 
                                        variant="default"
                                        disabled={sendingEmail || !targetEmail}
                                        className="shrink-0"
                                    >
                                        {sendingEmail ? (
                                            <Loader2 className="h-4 w-4 animate-spin"/>
                                        ) : (
                                            <Mail className="h-4 w-4"/> 
                                        )}
                                    </Button>
                                </div>
                                {!account.correo && !targetEmail && (
                                    <div className="flex items-center gap-1 text-xs text-amber-600">
                                        <AlertCircle className="h-3 w-3" />
                                        <span>Cliente sin correo registrado.</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3 pt-2">
                            <Button onClick={handleNewOperation} size="lg" className="w-full bg-gradient-to-r from-primary to-accent text-white shadow-md">
                                <RotateCcw className="h-5 w-5 mr-2"/> Finalizar / Nueva Operación
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}