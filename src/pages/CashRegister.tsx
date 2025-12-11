import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, LockOpen, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SummaryCards } from '@/components/cashregister/SummaryCards';
import { TransactionLogTable } from '@/components/cashregister/TransactionLogTable';
import { ClosurePanel } from '@/components/cashregister/ClosurePanel';
import { toast } from 'sonner';
import { cajaService } from '@/api/cajaService';
import { Caja, Transaction } from '@/types/operations';

export default function CashRegister() {
    const navigate = useNavigate();
    const [caja, setCaja] = useState<Caja | null>(null);
    const [movements, setMovements] = useState<Transaction[]>([]); // Estado para movimientos
    const [loading, setLoading] = useState(true);
    const [initialBalance, setInitialBalance] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Carga de datos inicial
    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Obtener estado de caja
            const dataCaja = await cajaService.obtenerCajaActual();
            setCaja(dataCaja);

            // 2. Si hay caja abierta, obtener sus movimientos
            if (dataCaja) {
                const dataMovimientos = await cajaService.obtenerMovimientos();
                setMovements(dataMovimientos);
            }
        } catch (error: any) {
            console.log("Caja cerrada o error de conexión");
            setCaja(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleOpenCash = async (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(initialBalance);
        
        if (isNaN(amount) || amount < 0) {
            toast.error('Ingrese un monto válido');
            return;
        }

        setIsSubmitting(true);
        try {
            const nuevaCaja = await cajaService.abrirCaja(amount);
            setCaja(nuevaCaja);
            setMovements([]); // Caja nueva nace sin movimientos
            toast.success('Caja abierta correctamente');
        } catch (error) {
            toast.error('Error al abrir la caja.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCloseCash = async (saldoReal: number) => {
        try {
            await cajaService.cerrarCaja(saldoReal);
            toast.success('Caja cerrada correctamente');
            setCaja(null);
            setMovements([]);
            setInitialBalance('');
        } catch (error) {
            toast.error('Error al cerrar la caja');
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!caja) {
        // ... (Tu código de formulario de apertura se mantiene igual aquí)
        // Solo por brevedad no lo repito completo, usa el bloque if(!caja) del paso anterior
        return (
            <div className="max-w-md mx-auto mt-20 space-y-6">
                 {/* ... Header y Card de Apertura ... */}
                 <Card className="border-0 shadow-xl overflow-hidden">
                    <CardHeader className="text-center pb-2">
                        <CardTitle className="text-2xl">Apertura de Caja</CardTitle>
                        <CardDescription>Ingrese el saldo inicial para comenzar.</CardDescription>
                    </CardHeader>
                    <form onSubmit={handleOpenCash}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="initialBalance">Saldo Inicial (Efectivo)</Label>
                                <Input
                                    id="initialBalance"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    placeholder="0.00"
                                    value={initialBalance}
                                    onChange={(e) => setInitialBalance(e.target.value)}
                                    autoFocus
                                    required
                                />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button type="submit" className="w-full" disabled={isSubmitting}>
                                {isSubmitting ? 'Abriendo...' : 'Abrir Caja'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6 p-4">
            <div className="flex items-center gap-4">
                <Button variant="outline" onClick={() => navigate('/')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" /> Volver
                </Button>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Arqueo de Caja
                    </h1>
                    <p className="text-muted-foreground">
                        {caja.estado} • {new Date(caja.fechaApertura).toLocaleDateString()}
                    </p>
                </div>
            </div>

            <SummaryCards caja={caja} />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 space-y-6">
                    {/* AQUI PASAMOS LOS MOVIMIENTOS REALES AL COMPONENTE CORREGIDO */}
                    <TransactionLogTable transactions={movements} /> 
                </div>

                <div className="xl:col-span-1">
                    <ClosurePanel
                        theoreticalTotal={caja.saldoFinalEsperado}
                        onCloseRegister={handleCloseCash}
                    />
                </div>
            </div>
        </div>
    );
}