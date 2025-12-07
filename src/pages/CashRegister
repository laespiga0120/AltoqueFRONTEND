import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Landmark, Banknote, Smartphone } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { SummaryCards } from '@/components/cashregister/SummaryCards';
import { TransactionLogTable } from '@/components/cashregister/TransactionLogTable';
import { ClosurePanel } from '@/components/cashregister/ClosurePanel';
import { getCashRegisterSummary } from '@/lib/operationsData';
import { toast } from 'sonner';

export default function CashRegister() {
    const navigate = useNavigate();
    const [summary, setSummary] = useState(getCashRegisterSummary);

    const handleCloseCash = () => {
        setSummary(prev => ({ ...prev, status: 'closed' }));
        toast.success('Caja cerrada correctamente');
    };

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
                    {summary.status === 'open' ? (
                        <ClosurePanel
                            theoreticalTotal={summary.theoreticalTotal}
                            onClose={handleCloseCash}
                        />
                    ) : (
                        <Card
                            className="border-0 overflow-hidden"
                            style={{
                                background: 'var(--gradient-card)',
                                boxShadow: 'var(--shadow-card)'
                            }}
                        >
                            <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                                <div className="p-4 rounded-full bg-green-100 mb-4">
                                    <Landmark className="h-12 w-12 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-green-600 mb-2">
                                    Caja Cerrada
                                </h3>
                                <p className="text-muted-foreground">
                                    El arqueo del día ha sido completado
                                </p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            </div>
        </div>
    );
}
