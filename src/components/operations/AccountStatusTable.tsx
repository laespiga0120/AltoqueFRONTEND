import { Info, AlertTriangle, CheckCircle, Clock, CalendarClock } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { AccountStatus, CuotaEstado } from '@/types/operations';
import { formatCurrency } from '@/lib/operationsData';

interface AccountStatusTableProps {
    account: AccountStatus;
}

// Mapeo de estados del Backend a configuración visual
const getStatusConfig = (status: string) => {
    const normalized = status.toLowerCase();
    if (normalized.includes('pagado')) return { label: 'Pagado', variant: 'success', icon: CheckCircle, className: 'bg-green-600 hover:bg-green-700' };
    if (normalized.includes('mora activa')) return { label: status, variant: 'destructive', icon: AlertTriangle, className: '' };
    if (normalized.includes('adelanto')) return { label: 'Adelanto', variant: 'secondary', icon: CheckCircle, className: 'bg-blue-500/15 text-blue-700 hover:bg-blue-500/25' };
    return { label: 'Pendiente', variant: 'outline', icon: Clock, className: '' };
};

export function AccountStatusTable({ account }: AccountStatusTableProps) {
    if (!account.cuotas || account.cuotas.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-4 text-primary" />
                <p className="text-lg font-semibold">Sin deuda pendiente</p>
                <p className="text-sm">Este cliente no tiene cuotas registradas.</p>
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-border/50 overflow-hidden bg-card/50">
            <Table>
                <TableHeader>
                    <TableRow className="bg-secondary/30 hover:bg-secondary/40">
                        <TableHead className="font-bold">Periodo</TableHead>
                        <TableHead className="font-bold">Vencimiento</TableHead>
                        <TableHead className="font-bold text-right font-mono">Cuota Original</TableHead>
                        <TableHead className="font-bold text-right font-mono">Saldo Pendiente</TableHead>
                        <TableHead className="font-bold">Estado</TableHead>
                        <TableHead className="font-bold text-right font-mono">Mora</TableHead>
                        <TableHead className="font-bold text-right font-mono">Total</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {account.cuotas.map((cuota) => (
                        <InstallmentRow key={cuota.id} installment={cuota} />
                    ))}
                </TableBody>
            </Table>

            {/* Summary Footer */}
            <div className="p-4 bg-secondary/20 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-8">
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Deuda Original:</span>
                        <span className="text-xl font-bold font-mono text-muted-foreground">
                            {formatCurrency(account.deudaOriginalTotal)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Deuda Pendiente Total:</span>
                        <span className="text-2xl font-bold font-mono text-primary">
                            {formatCurrency(account.deudaPendienteTotal)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InstallmentRow({ installment }: { installment: CuotaEstado }) {
    const config = getStatusConfig(installment.estado);
    const StatusIcon = config.icon;

    // Detectar si hay pago parcial (Cuota original > Saldo pendiente > 0)
    const hasPartialPayment = installment.saldoPendiente > 0 && installment.saldoPendiente < installment.cuotaOriginal;
    const montoPagadoParcial = installment.cuotaOriginal - installment.saldoPendiente;

    return (
        <TableRow className="hover:bg-secondary/10 transition-colors">
            <TableCell className="font-semibold">
                Cuota {installment.numeroCuota}
            </TableCell>
            <TableCell>
                <div className="flex items-center gap-2">
                    <CalendarClock className="h-3 w-3 text-muted-foreground" />
                    {new Date(installment.fechaVencimiento).toLocaleDateString('es-PE', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                    })}
                </div>
            </TableCell>
            <TableCell className="text-right font-mono text-muted-foreground">
                {formatCurrency(installment.cuotaOriginal)}
            </TableCell>
            <TableCell className="text-right font-mono">
                <div className="flex items-center justify-end gap-2">
                    <span className={installment.saldoPendiente > 0 ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {formatCurrency(installment.saldoPendiente)}
                    </span>
                    {hasPartialPayment && (
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-popover">
                                <p className="font-semibold mb-1">Pago parcial detectado</p>
                                <p className="text-sm text-muted-foreground">
                                    Se ha amortizado {formatCurrency(montoPagadoParcial)}
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <Badge
                    variant={config.variant as any}
                    className={cn("gap-1.5", config.className)}
                >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
                {installment.moraGenerada > 0 ? (
                    <span className="text-destructive font-semibold">
                        +{formatCurrency(installment.moraGenerada)}
                    </span>
                ) : (
                    <span className="text-muted-foreground">-</span>
                )}
            </TableCell>
             <TableCell className="text-right font-mono font-bold">
                {formatCurrency(installment.totalAPagar)}
            </TableCell>
        </TableRow>
    );
}