import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, Banknote, Smartphone, LockOpen } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SummaryCards } from '@/components/cashregister/SummaryCards';
import { TransactionLogTable } from '@/components/cashregister/TransactionLogTable';
import { ClosurePanel } from '@/components/cashregister/ClosurePanel';
import { getCashRegisterSummary, openCashRegister, closeCashRegister as closeCashRegisterLib } from '@/lib/operationsData';
import { toast } from 'sonner';

export default function CashRegister() {
    const navigate = useNavigate();
    // Force re-render on mount to catch localStorage changes
    const [summary, setSummary] = useState(getCashRegisterSummary());
    const [initialBalance, setInitialBalance] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        setSummary(getCashRegisterSummary());
    }, []);

    const handleOpenCash = (e: React.FormEvent) => {
        e.preventDefault();
        const amount = parseFloat(initialBalance);
        
        if (isNaN(amount) || amount < 0) {
            toast.error('Ingrese un monto válido');
            return;
        }

        setIsSubmitting(true);
        // Simulate API delay
        setTimeout(() => {
            openCashRegister(amount, 'admin'); // Hardcoded operator for now
            setSummary(getCashRegisterSummary());
            toast.success('Caja abierta correctamente');
            setIsSubmitting(false);
        }, 800);
    };

    const handleCloseCash = () => {
        closeCashRegisterLib();
        setSummary(getCashRegisterSummary());
        toast.success('Caja cerrada correctamente');
    };

    // If closed, show Opening Form
    if (summary.status === 'closed') {
        return (
            <div className="max-w-md mx-auto mt-20 space-y-6">
                 <div className="flex items-center gap-4 mb-8">
                    <Button
                        variant="ghost"
                        onClick={() => navigate('/')}
                        className="gap-2"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Volver al Inicio
                    </Button>
                </div>

                <Card className="border-0 shadow-xl overflow-hidden">
                    <div className="h-2 bg-gradient-to-r from-primary to-accent" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto p-4 rounded-full bg-primary/10 w-fit mb-4">
                            <LockOpen className="h-8 w-8 text-primary" />
                        </div>
                        <CardTitle className="text-2xl">Apertura de Caja</CardTitle>
                        <CardDescription>
                            Ingrese el saldo inicial para comenzar las operaciones del día.
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleOpenCash}>
                        <CardContent className="space-y-4 pt-4">
                            <div className="space-y-2">
                                <Label htmlFor="initialBalance">Saldo Inicial (Efectivo)</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">S/</span>
                                    <Input
                                        id="initialBalance"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="0.00"
                                        className="pl-9 text-lg"
                                        value={initialBalance}
                                        onChange={(e) => setInitialBalance(e.target.value)}
                                        autoFocus
                                        required
                                    />
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    Este monto representa el dinero físico existente en caja al inicio del turno.
                                </p>
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button 
                                type="submit" 
                                className="w-full bg-gradient-to-r from-primary to-accent text-white font-medium"
                                size="lg"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Abriendo...' : 'Abrir Caja'}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Button
                    variant="outline"
                    onClick={() => navigate('/')}
                    className="gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </Button>
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Arqueo de Caja
                    </h1>
                    <p className="text-muted-foreground">
                        Control de efectivo y cierre diario • {new Date(summary.date).toLocaleDateString('es-PE', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                        })}
                    </p>
                </div>
            </div>

            {/* Summary Cards */}
            <SummaryCards summary={summary} />

            {/* Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Transaction Log - Takes 2 columns */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Physical vs Digital Sections */}
                    <Card
                        className="border-0 overflow-hidden"
                        style={{
                            background: 'var(--gradient-card)',
                            boxShadow: 'var(--shadow-card)'
                        }}
                    >
                        <CardHeader>
                            <div className="flex items-center gap-3">
                                <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent shadow-lg">
                                    <Landmark className="h-6 w-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl">Movimientos del Día</CardTitle>
                                    <CardDescription className="text-base">
                                        Todas las transacciones registradas
                                    </CardDescription>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Legend */}
                            <div className="flex flex-wrap gap-4 p-4 rounded-xl bg-secondary/20 border border-border/50">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-green-100">
                                        <Banknote className="h-4 w-4 text-green-700" />
                                    </div>
                                    <span className="text-sm font-medium">Dinero Físico</span>
                                </div>
                                <Separator orientation="vertical" className="h-6" />
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 rounded-lg bg-purple-100">
                                        <Smartphone className="h-4 w-4 text-purple-700" />
                                    </div>
                                    <span className="text-sm font-medium">Dinero Digital</span>
                                </div>
                            </div>

                            <TransactionLogTable transactions={summary.transactions} />
                        </CardContent>
                    </Card>
                </div>

                {/* Closure Panel - Takes 1 column */}
                <div className="xl:col-span-1">
                    {/* Since we are handling "closed" state at the top level, this part will mostly be for "open" state actions */}
                    <ClosurePanel
                        theoreticalTotal={summary.theoreticalTotal}
                        onClose={handleCloseCash}
                    />
                </div>
            </div>
        </div>
    );
}
