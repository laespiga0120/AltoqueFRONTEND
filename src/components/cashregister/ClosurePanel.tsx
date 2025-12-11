import { useState } from 'react';
import { CheckCircle2, AlertTriangle, Lock, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { toast } from 'sonner';
import { formatCurrency } from '@/lib/operationsData';
import { cn } from '@/lib/utils';

interface ClosurePanelProps {
    theoreticalTotal: number;
    onCloseRegister: (amount: number) => void; // Cambié el nombre para ser más explícito
}

export function ClosurePanel({ theoreticalTotal, onCloseRegister }: ClosurePanelProps) {
    const [countedCash, setCountedCash] = useState('');
    const [processing, setProcessing] = useState(false);

    const counted = parseFloat(countedCash) || 0;
    const difference = counted - theoreticalTotal;
    const isBalanced = Math.abs(difference) < 0.01;
    const showResult = countedCash.length > 0;

    const handleClose = () => {
        if (!showResult) {
            toast.error('Ingrese el efectivo contado');
            return;
        }

        setProcessing(true);
        setTimeout(() => {
            toast.success('Caja cerrada exitosamente. Reporte generado.');
            setProcessing(false);
            onCloseRegister(counted);
        }, 1500);
    };

    return (
        <Card
            className="border-0 overflow-hidden"
            style={{
                background: 'var(--gradient-card)',
                boxShadow: 'var(--shadow-card)'
            }}
        >
            <CardHeader className="border-b border-border/50">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                        <Lock className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <CardTitle className="text-xl">Cierre de Caja</CardTitle>
                        <CardDescription className="text-base">
                            Ingrese el efectivo físico contado para validar el cuadre
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
                {/* Theoretical Display */}
                <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-muted-foreground">
                            Total en Caja (Teórico):
                        </span>
                        <span className="text-2xl font-bold font-mono text-primary">
                            {formatCurrency(theoreticalTotal)}
                        </span>
                    </div>
                </div>

                {/* Counted Cash Input */}
                <div className="space-y-2">
                    <Label htmlFor="countedCash" className="text-base font-semibold">
                        Efectivo Contado
                    </Label>
                    <Input
                        id="countedCash"
                        type="number"
                        placeholder="0.00"
                        value={countedCash}
                        onChange={(e) => setCountedCash(e.target.value)}
                        className="h-16 text-3xl font-mono font-bold text-center"
                        step="0.01"
                        min="0"
                    />
                </div>

                {/* Difference Calculator */}
                {showResult && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-semibold text-muted-foreground">
                                    Diferencia:
                                </span>
                                <span className={cn(
                                    "text-2xl font-bold font-mono",
                                    isBalanced ? "text-green-600" : "text-destructive"
                                )}>
                                    {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                                </span>
                            </div>
                        </div>

                        {isBalanced ? (
                            <Alert className="border-green-500/50 bg-green-50">
                                <CheckCircle2 className="h-8 w-8 text-green-600" />
                                <AlertDescription className="text-lg font-bold text-green-700 ml-2">
                                    ✓ Caja Cuadrada
                                </AlertDescription>
                            </Alert>
                        ) : (
                            <Alert variant="destructive">
                                <AlertTriangle className="h-6 w-6" />
                                <AlertDescription className="font-bold text-base ml-2">
                                    Descuadre de: {formatCurrency(Math.abs(difference))}
                                    <span className="block text-sm font-normal mt-1">
                                        {difference > 0 ? 'Sobrante en caja' : 'Faltante en caja'}
                                    </span>
                                </AlertDescription>
                            </Alert>
                        )}
                    </div>
                )}

                {/* Close Button */}
                <Button
                    onClick={handleClose}
                    disabled={processing || !showResult || !isBalanced}
                    size="lg"
                    className="w-full h-14 text-lg font-bold gap-3 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-all"
                >
                    <FileText className="h-5 w-5" />
                    {processing ? 'Procesando...' : 'Cerrar Caja'}
                </Button>
            </CardContent>
        </Card>
    );

}
