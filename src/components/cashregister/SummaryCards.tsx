import { Wallet, ArrowDownCircle, Coins, Smartphone, Calculator } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Caja } from '@/types/operations'; // Usamos el tipo correcto
import { formatCurrency } from '@/lib/operationsData'; // Asumiendo que tienes esta utilidad
import { cn } from '@/lib/utils';

interface SummaryCardsProps {
    caja: Caja;
}

export function SummaryCards({ caja }: SummaryCardsProps) {
    const cards = [
        {
            label: 'Saldo Inicial',
            value: caja.saldoInicial,
            icon: Wallet,
            iconBg: 'bg-blue-100 text-blue-600',
        },
        {
            label: 'Entradas Efectivo',
            value: caja.totalEfectivoSistema,
            icon: ArrowDownCircle,
            iconBg: 'bg-green-100 text-green-600',
        },
        {
            label: 'Ajuste Redondeo',
            value: caja.totalAjusteRedondeo,
            icon: Coins,
            iconBg: caja.totalAjusteRedondeo >= 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600',
            showSign: true,
        },
        {
            label: 'Entradas Digitales',
            value: caja.totalDigitalSistema,
            icon: Smartphone,
            iconBg: 'bg-purple-100 text-purple-600',
        },
        {
            label: 'Total en Caja (Teórico)',
            value: caja.saldoFinalEsperado,
            icon: Calculator,
            iconBg: 'bg-primary/20 text-primary',
            highlight: true,
        },
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {cards.map((card) => (
                <Card
                    key={card.label}
                    className={cn(
                        "border-0 overflow-hidden transition-all duration-300 hover:shadow-lg",
                        card.highlight && "ring-2 ring-primary/30"
                    )}
                    style={{
                        background: 'var(--gradient-card)',
                        boxShadow: 'var(--shadow-card)'
                    }}
                >
                    <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                            <div className={cn("p-2.5 rounded-xl", card.iconBg)}>
                                <card.icon className="h-5 w-5" />
                            </div>
                        </div>
                        <p className="text-sm font-medium text-muted-foreground mb-1">
                            {card.label}
                        </p>
                        <p className={cn(
                            "text-xl font-bold font-mono",
                            card.showSign && card.value < 0 && "text-destructive",
                            card.showSign && card.value > 0 && "text-green-600",
                            card.highlight && "text-primary text-2xl"
                        )}>
                            {card.showSign && card.value > 0 && '+'}
                            {formatCurrency(card.value)}
                        </p>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}