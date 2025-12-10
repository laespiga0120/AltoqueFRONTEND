import { useState } from 'react';
import {
    Banknote,
    Printer,
    Mail,
    CheckCircle2,
    RotateCcw,
    Receipt,
    Globe,
    Download
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
import { MercadoPagoButton } from '@/components/MercadoPagoButton';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

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
    
    const [processing, setProcessing] = useState(false);
    const [paymentResult, setPaymentResult] = useState<PagoResponse | null>(null);

    const totalPendingDebt = account?.deudaPendienteTotal || 0;
    const parsedAmount = parseFloat(amount) || 0;
    const { adjustment, rounded } = calculateRounding(parsedAmount);

    const suggestedAmounts = [
        { label: 'Deuda Total', value: totalPendingDebt },
    ].filter(s => s.value > 0);
    
    // Buscar cuota pendiente más antigua
    const currentInstallment = account?.cuotas?.find(c => c.totalAPagar > 0);
    if (currentInstallment) {
        suggestedAmounts.unshift({ label: `Cuota ${currentInstallment.numeroCuota}`, value: currentInstallment.totalAPagar });
    }

    const handleCashProcess = async () => {
        if (parsedAmount <= 0) {
            toast.error('Ingrese un monto válido');
            return;
        }

        setProcessing(true);
        try {
            // Construimos el DTO exacto que Java espera
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
            
            // Notificamos al padre pero NO cerramos el modal aun para que vea el voucher
            // El cierre real se hace al dar click en "Nueva Operación" o cerrar el dialogo
        } catch (error) {
            console.error(error);
            toast.error('Error procesando el pago. Intente nuevamente.');
        } finally {
            setProcessing(false);
        }
    };

    const handleSendEmail = () => {
        const subject = encodeURIComponent(`Comprobante de Pago - ${account.clienteNombre}`);
        const body = encodeURIComponent(`
Estimado(a) ${account.clienteNombre},

Se ha registrado su pago correctamente.

Detalles de la Operación:
-------------------------
Monto Pagado: ${formatCurrency(parsedAmount)}
Fecha: ${new Date().toLocaleString()}
Documento: ${account.documento}

Deuda Restante: ${paymentResult?.deudaRestante ? formatCurrency(paymentResult.deudaRestante) : 'N/A'}

Gracias por su preferencia.
La Espiga
        `);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    };

    const handleNewOperation = () => {
        setStep('input');
        setAmount('');
        setTab('EFECTIVO');
        setPaymentResult(null);
        onSuccess(); // Aquí notificamos al padre para que refresque datos
    };

    const generatePDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('COMPROBANTE DE PAGO', 105, 20, { align: 'center' });
        
        doc.setFontSize(10);
        doc.text(`Fecha: ${new Date().toLocaleString()}`, 105, 30, { align: 'center' });
        doc.text('La Espiga - Préstamos', 105, 36, { align: 'center' });

        doc.setFontSize(11);
        doc.text('Detalles del Cliente:', 14, 50);
        
        doc.setFontSize(10);
        doc.text(`Cliente: ${account.clienteNombre}`, 14, 58);
        doc.text(`Documento: ${account.documento}`, 14, 64);
        
        const tableData = [
            ['Concepto', 'Valor'],
            ['Monto Recibido', formatCurrency(parsedAmount)],
            ['Ajuste Redondeo', formatCurrency(adjustment)],
            ['Total Cobrado', formatCurrency(rounded)],
        ];
        
        if (paymentResult?.deudaRestante !== undefined) {
             tableData.push(['Deuda Restante', formatCurrency(paymentResult.deudaRestante)]);
        }

        autoTable(doc, {
            startY: 75,
            head: [['Descripción', 'Monto']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [66, 66, 66] },
        });

        // Detalle de Cobertura (Waterfall)
        if(paymentResult?.detallesCobertura && paymentResult.detallesCobertura.length > 0) {
             const coberturaData = paymentResult.detallesCobertura.map(d => [d]);
             autoTable(doc, {
                startY: (doc as any).lastAutoTable.finalY + 10,
                head: [['Desglose de Aplicación']],
                body: coberturaData,
                theme: 'striped'
            });
        }

        const finalY = (doc as any).lastAutoTable.finalY + 20;
        doc.text('Gracias por su pago', 105, finalY, { align: 'center' });
        
        return doc;
    };

    const handlePrint = () => {
        const doc = generatePDF();
        doc.autoPrint();
        window.open(doc.output('bloburl'), '_blank');
    };

    const handleDownload = () => {
        const doc = generatePDF();
        doc.save(`voucher_${account.documento}_${Date.now()}.pdf`);
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
                                    Online
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
                                    <MercadoPagoButton 
                                        loanId={account.prestamoId}
                                        amount={parsedAmount}
                                        clientName={account.clienteNombre}
                                        disabled={parsedAmount <= 0}
                                    />
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 rounded-full bg-green-100 mb-4">
                                <CheckCircle2 className="h-16 w-16 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-600">¡Pago Registrado!</h3>
                            <p className="text-muted-foreground">Operación completada</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                             <Button onClick={handlePrint} variant="outline" className="w-full">
                                <Printer className="h-4 w-4 mr-2"/> Imprimir
                            </Button>
                            <Button onClick={handleDownload} variant="outline" className="w-full">
                                <Download className="h-4 w-4 mr-2"/> Descargar
                            </Button>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <Button onClick={handleSendEmail} variant="outline" className="w-full">
                                <Mail className="h-4 w-4 mr-2"/> Enviar por Correo
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button onClick={handleNewOperation} size="lg" className="w-full">
                                <RotateCcw className="h-5 w-5 mr-2"/> Nueva Operación
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}