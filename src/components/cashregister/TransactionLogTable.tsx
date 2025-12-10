import { useState } from 'react';
import { Filter, Banknote, Smartphone, CreditCard, Receipt } from 'lucide-react';
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
import { Transaction } from '@/types/operations';
import { formatCurrency } from '@/lib/operationsData';
import { cn } from '@/lib/utils';

interface TransactionLogTableProps {
    transactions: Transaction[];
}

// CONFIGURACIÓN ALINEADA CON EL BACKEND (Claves en Mayúsculas)
const methodConfig: Record<string, { label: string; icon: any; color: string }> = {
    'EFECTIVO': { label: 'Efectivo', icon: Banknote, color: 'bg-green-100 text-green-700' },
    'YAPE': { label: 'Yape', icon: Smartphone, color: 'bg-purple-100 text-purple-700' },
    'PLIN': { label: 'Plin', icon: Smartphone, color: 'bg-teal-100 text-teal-700' },
    'TARJETA': { label: 'Tarjeta', icon: CreditCard, color: 'bg-blue-100 text-blue-700' },
    'TRANSFERENCIA': { label: 'Transferencia', icon:  CreditCard, color: 'bg-orange-100 text-orange-700' },
    // Fallback por defecto
    'DEFAULT': { label: 'Otro', icon: Receipt, color: 'bg-gray-100 text-gray-700' }
};

export function TransactionLogTable({ transactions }: TransactionLogTableProps) {
    const [methodFilter, setMethodFilter] = useState<string[]>([]);

    const filteredTransactions = methodFilter.length > 0
        ? transactions.filter(t => methodFilter.includes(t.method))
        : transactions;

    const toggleFilter = (method: string) => {
        setMethodFilter(prev =>
            prev.includes(method)
                ? prev.filter(m => m !== method)
                : [...prev, method]
        );
    };

    const getMethodStyle = (method: string) => {
        return methodConfig[method] || methodConfig['DEFAULT'];
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
                        {Object.entries(methodConfig).map(([key, config]) => {
                            if (key === 'DEFAULT') return null;
                            return (
                                <DropdownMenuCheckboxItem
                                    key={key}
                                    checked={methodFilter.includes(key)}
                                    onCheckedChange={() => toggleFilter(key)}
                                >
                                    <config.icon className="h-4 w-4 mr-2" />
                                    {config.label}
                                </DropdownMenuCheckboxItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                            <TableHead className="font-bold w-[100px]">Hora</TableHead>
                            <TableHead className="font-bold">Cliente</TableHead>
                            <TableHead className="font-bold">Método</TableHead>
                            <TableHead className="font-bold text-right font-mono hidden md:table-cell">Monto Deuda</TableHead>
                            <TableHead className="font-bold text-right font-mono hidden md:table-cell">Redondeo</TableHead>
                            <TableHead className="font-bold text-right font-mono text-primary">Ingreso Real</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTransactions.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                    No hay transacciones registradas en esta sesión.
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredTransactions.map((tx) => {
                                const style = getMethodStyle(tx.method);
                                const MethodIcon = style.icon;

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
                                                <p className="font-semibold text-sm">{tx.clientName}</p>
                                                {tx.clientDNI && tx.clientDNI !== '-' && (
                                                    <p className="text-xs text-muted-foreground">{tx.clientDNI}</p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn("gap-1.5 px-2 py-0.5", style.color)} variant="secondary">
                                                <MethodIcon className="h-3 w-3" />
                                                {tx.method}
                                            </Badge>
                                        </TableCell>
                                        
                                        {/* Monto Sistema (Deuda pagada) */}
                                        <TableCell className="text-right font-mono text-muted-foreground hidden md:table-cell">
                                            {formatCurrency(tx.systemAmount)}
                                        </TableCell>
                                        
                                        {/* Ajuste Redondeo */}
                                        <TableCell className="text-right font-mono hidden md:table-cell">
                                            <span className={cn(
                                                'font-semibold text-xs',
                                                tx.roundingAdjustment < 0 && 'text-red-500',
                                                tx.roundingAdjustment > 0 && 'text-green-600',
                                                tx.roundingAdjustment === 0 && 'text-muted-foreground opacity-50'
                                            )}>
                                                {tx.roundingAdjustment === 0
                                                    ? '—'
                                                    : `${tx.roundingAdjustment > 0 ? '+' : ''}${formatCurrency(tx.roundingAdjustment)}`
                                                }
                                            </span>
                                        </TableCell>

                                        {/* Monto Real (Lo que entró a caja) */}
                                        <TableCell className="text-right font-mono font-bold text-base text-foreground">
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