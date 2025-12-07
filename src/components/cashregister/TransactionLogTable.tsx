import { useState } from 'react';
import { Filter, Banknote, Smartphone, CreditCard } from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuCheckboxItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Transaction, PaymentMethod, TransactionType } from '@/types/operations';
import { formatCurrency } from '@/lib/operationsData';
import { cn } from '@/lib/utils';

interface TransactionLogTableProps {
    transactions: Transaction[];
}

const methodConfig: Record<PaymentMethod, { label: string; icon: typeof Banknote; color: string }> = {
    cash: { label: 'Efectivo', icon: Banknote, color: 'bg-green-100 text-green-700' },
    yape: { label: 'Yape', icon: Smartphone, color: 'bg-purple-100 text-purple-700' },
    plin: { label: 'Plin', icon: Smartphone, color: 'bg-teal-100 text-teal-700' },
    card: { label: 'Tarjeta', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
};

const typeLabels: Record<TransactionType, string> = {
    payment: 'Pago Cuota',
    opening: 'Apertura',
    closing: 'Cierre',
    adjustment: 'Ajuste',
};

export function TransactionLogTable({ transactions }: TransactionLogTableProps) {
    const [methodFilter, setMethodFilter] = useState<PaymentMethod[]>([]);

    const filteredTransactions = methodFilter.length > 0
        ? transactions.filter(t => methodFilter.includes(t.method))
        : transactions;

    const toggleFilter = (method: PaymentMethod) => {
        setMethodFilter(prev =>
            prev.includes(method)
                ? prev.filter(m => m !== method)
                : [...prev, method]
        );
    };

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Desglose de Movimientos</h3>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" className="gap-2">
                            <Filter className="h-4 w-4" />
                            Filtrar
                            {methodFilter.length > 0 && (
                                <Badge variant="secondary" className="ml-1">
                                    {methodFilter.length}
                                </Badge>
                            )}
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover">
                        {Object.entries(methodConfig).map(([method, config]) => (
                            <DropdownMenuCheckboxItem
                                key={method}
                                checked={methodFilter.includes(method as PaymentMethod)}
                                onCheckedChange={() => toggleFilter(method as PaymentMethod)}
                            >
                                <config.icon className="h-4 w-4 mr-2" />
                                {config.label}
                            </DropdownMenuCheckboxItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                            <TableHead className="font-bold">Hora</TableHead>
                            <TableHead className="font-bold">Cliente</TableHead>
                            <TableHead className="font-bold">Tipo Operación</TableHead>
                            <TableHead className="font-bold">Método</TableHead>
                            <TableHead className="font-bold text-right font-mono">Monto Sistema</TableHead>
                            <TableHead className="font-bold text-right font-mono">Redondeo</TableHead>
                            <TableHead className="font-bold text-right font-mono">Monto Real</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                    No hay transacciones que mostrar
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((tx) => {
                                const config = methodConfig[tx.method];
                                const MethodIcon = config.icon;

                                return (
                                    <TableRow key={tx.id} className="hover:bg-secondary/10 transition-colors">
                                        <TableCell className="font-mono text-sm">
                                            {new Date(tx.timestamp).toLocaleTimeString('es-PE', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </TableCell>
                                        <TableCell>
                                            <div>
                                                <p className="font-semibold">{tx.clientName}</p>
                                                {tx.clientDNI !== 'SYSTEM' && (
                                                    <p className="text-xs text-muted-foreground">{tx.clientDNI}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{typeLabels[tx.type]}</Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("gap-1.5", config.color)}>
                                                <MethodIcon className="h-3 w-3" />
                                                {config.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            {formatCurrency(tx.systemAmount)}
                                        </TableCell>
                                        <TableCell className="text-right font-mono">
                                            <span className={cn(
                                                'font-semibold',
                                                tx.roundingAdjustment < 0 && 'text-destructive',
                                                tx.roundingAdjustment > 0 && 'text-green-600',
                                                tx.roundingAdjustment === 0 && 'text-muted-foreground'
                                            )}>
                                                {tx.roundingAdjustment === 0
                                                    ? '—'
                                                    : `${tx.roundingAdjustment > 0 ? '+' : ''}${formatCurrency(tx.roundingAdjustment)}`
                                                }
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-mono font-bold text-primary">
                                            {formatCurrency(tx.realAmount)}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}