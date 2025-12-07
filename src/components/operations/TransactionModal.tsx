import { useState } from 'react';
import {
    CreditCard,
    Banknote,
    Smartphone,
    Printer,
    Mail,
    CheckCircle2,
    RotateCcw,
    Receipt
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ClientAccount, PaymentMethod } from '@/types/operations';
import { formatCurrency, calculateRounding } from '@/lib/operationsData';
import { cn } from '@/lib/utils';

interface TransactionModalProps {
    open: boolean;
    onClose: () => void;
    account: ClientAccount;
}

type Step = 'input' | 'success';

export function TransactionModal({ open, onClose, account }: TransactionModalProps) {
    const [step, setStep] = useState<Step>('input');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<PaymentMethod>('cash');
    const [processing, setProcessing] = useState(false);
    const [transactionId, setTransactionId] = useState('');

    const parsedAmount = parseFloat(amount) || 0;
    const { adjustment, rounded } = calculateRounding(parsedAmount);
    const isCash = method === 'cash';

    const suggestedAmounts = [
        { label: 'Pago Mínimo (Saldo anterior)', value: account.previousPendingBalance },
        { label: 'Cuota del Mes', value: account.currentMonthPayment },
        { label: 'Deuda Total', value: account.totalDebt },
    ].filter(s => s.value > 0);

    const handleProcess = () => {
        if (parsedAmount <= 0) {
            toast.error('Ingrese un monto válido');
            return;
        }

        setProcessing(true);
        setTimeout(() => {
            const txId = `TX-${Date.now().toString(36).toUpperCase()}`;
            setTransactionId(txId);
            setStep('success');
            setProcessing(false);
            toast.success('Transacción procesada correctamente');
        }, 1500);
    };

    const handlePrint = () => {
        toast.success('Generando voucher para impresión...');
        window.print();
    };

    const handleEmail = () => {
        toast.success('Voucher enviado al correo del cliente');
    };

    const handleNewOperation = () => {
        setStep('input');
        setAmount('');
        setMethod('cash');
        setTransactionId('');
        onClose();
    };

    const handleClose = () => {
        if (step === 'success') {
            handleNewOperation();
        } else {
            onClose();
        }
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
                        {/* Client Info */}
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                            <p className="font-semibold text-lg">{account.clientName}</p>
                            <p className="text-sm text-muted-foreground">DNI: {account.clientDNI}</p>
                            <p className="text-sm font-mono mt-2">
                                Deuda Total: <span className="font-bold text-destructive">{formatCurrency(account.totalDebt)}</span>
                            </p>
                        </div>

                        {/* Payment Method Tabs */}
                        <Tabs value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                            <TabsList className="grid w-full grid-cols-4 h-12">
                                <TabsTrigger value="cash" className="gap-2">
                                    <Banknote className="h-4 w-4" />
                                    <span className="hidden sm:inline">Efectivo</span>
                                </TabsTrigger>
                                <TabsTrigger value="yape" className="gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    <span className="hidden sm:inline">Yape</span>
                                </TabsTrigger>
                                <TabsTrigger value="plin" className="gap-2">
                                    <Smartphone className="h-4 w-4" />
                                    <span className="hidden sm:inline">Plin</span>
                                </TabsTrigger>
                                <TabsTrigger value="card" className="gap-2">
                                    <CreditCard className="h-4 w-4" />
                                    <span className="hidden sm:inline">Tarjeta</span>
                                </TabsTrigger>
                            </TabsList>

                            <TabsContent value={method} className="mt-4 space-y-4">
                                {/* Amount Input */}
                                <div className="space-y-2">
                                    <Label htmlFor="amount" className="text-base font-semibold">
                                        Monto a Pagar
                                    </Label>
                                    <Input
                                        id="amount"
                                        type="number"
                                        placeholder="0.00"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        className="h-14 text-2xl font-mono font-bold text-center"
                                        step="0.01"
                                        min="0"
                                    />
                                </div>

                                {/* Suggested Amounts */}
                                <div className="flex flex-wrap gap-2">
                                    {suggestedAmounts.map((suggestion) => (
                                        <Badge
                                            key={suggestion.label}
                                            variant="outline"
                                            className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors py-2 px-3"
                                            onClick={() => setAmount(suggestion.value.toString())}
                                        >
                                            {suggestion.label}: {formatCurrency(suggestion.value)}
                                        </Badge>
                                    ))}
                                </div>

                                {/* Rounding Ticket (Cash Only) */}
                                {isCash && parsedAmount > 0 && (
                                    <div className="p-4 rounded-xl bg-secondary/50 border-2 border-dashed border-border space-y-3">
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Receipt className="h-4 w-4" />
                                            <span className="font-semibold">Ticket de Pago</span>
                                        </div>

                                        <div className="space-y-2 font-mono text-sm">
                                            <div className="flex justify-between">
                                                <span>Subtotal:</span>
                                                <span>{formatCurrency(parsedAmount)}</span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span>Ajuste por Redondeo:</span>
                                                <span className={cn(
                                                    'font-semibold',
                                                    adjustment < 0 ? 'text-destructive' : adjustment > 0 ? 'text-green-600' : ''
                                                )}>
                                                    {adjustment >= 0 ? '+' : ''}{formatCurrency(adjustment)}
                                                </span>
                                            </div>
                                            <div className="border-t border-border pt-2 flex justify-between">
                                                <span className="font-semibold">Total a Cobrar:</span>
                                                <span className="text-xl font-bold text-primary">
                                                    {formatCurrency(rounded)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Process Button */}
                                <Button
                                    onClick={handleProcess}
                                    disabled={processing || parsedAmount <= 0}
                                    className="w-full h-14 text-lg font-bold bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
                                >
                                    {processing ? 'Procesando...' : 'Confirmar Pago'}
                                </Button>
                            </TabsContent>
                        </Tabs>
                    </div>
                ) : (
                    /* Success Step */
                    <div className="space-y-6 py-4">
                        <div className="flex flex-col items-center text-center">
                            <div className="p-4 rounded-full bg-green-100 mb-4">
                                <CheckCircle2 className="h-16 w-16 text-green-600" />
                            </div>
                            <h3 className="text-2xl font-bold text-green-600">¡Pago Exitoso!</h3>
                            <p className="text-muted-foreground mt-2">
                                Transacción: <span className="font-mono font-bold">{transactionId}</span>
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50 space-y-2 font-mono text-sm">
                            <div className="flex justify-between">
                                <span>Cliente:</span>
                                <span className="font-semibold">{account.clientName}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Monto Pagado:</span>
                                <span className="font-bold text-primary">
                                    {formatCurrency(isCash ? rounded : parsedAmount)}
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span>Método:</span>
                                <Badge variant="secondary" className="capitalize">{method}</Badge>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-3">
                            <Button
                                onClick={handlePrint}
                                size="lg"
                                className="h-14 gap-3 text-base font-semibold"
                                variant="outline"
                            >
                                <Printer className="h-5 w-5" />
                                Imprimir Voucher
                            </Button>
                            <Button
                                onClick={handleEmail}
                                size="lg"
                                className="h-14 gap-3 text-base font-semibold"
                                variant="outline"
                            >
                                <Mail className="h-5 w-5" />
                                Enviar por Correo
                            </Button>
                            <Button
                                onClick={handleNewOperation}
                                size="lg"
                                className="h-14 gap-3 text-base font-semibold bg-gradient-to-r from-primary to-accent text-white"
                            >
                                <RotateCcw className="h-5 w-5" />
                                Nueva Operación
                            </Button>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}