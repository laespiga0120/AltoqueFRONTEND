import { Info, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
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
import { ClientAccount, AccountInstallment, PaymentStatus } from '@/types/operations';
import { formatCurrency } from '@/lib/operationsData';

interface AccountStatusTableProps {
    account: ClientAccount;
}

const statusConfig: Record<PaymentStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' | 'success'; icon: any }> = {
    paid: {
        label: 'Pagado',
        variant: 'success', // We might need to add this variant to badge or use a standard one
        icon: CheckCircle,
    },
    current: {
        label: 'PENDIENTE de pago',
        variant: 'secondary',
        icon: Clock,
    },
    pending: {
        label: 'Pendiente',
        variant: 'outline',
        icon: Clock,
    },
    stopped_interest: {
        label: 'Mora Detenida',
        variant: 'default',
        icon: AlertTriangle,
    },
    overdue: {
        label: 'Mora Activa (1%)',
        variant: 'destructive',
        icon: AlertTriangle,
    },
};

export function AccountStatusTable({ account }: AccountStatusTableProps) {
    if (account.installments.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                <CheckCircle className="h-12 w-12 mb-4 text-primary" />
                <p className="text-lg font-semibold">Sin deuda pendiente</p>
                <p className="text-sm">Este cliente no tiene préstamos activos</p>
            </div>
        );
    }

    // Calculate totals
    const totalOriginalDebt = account.installments.reduce((sum, inst) => sum + inst.originalAmount, 0);
    const totalPendingDebt = account.installments.reduce((sum, inst) => sum + inst.pendingBalance, 0);

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
                        <TableHead className="font-bold text-right font-mono">Mora Generada</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {account.installments.map((installment) => (
                        <InstallmentRow key={installment.period} installment={installment} />
                    ))}
                </TableBody>
            </Table>

            {/* Summary Footer */}
            <div className="p-4 bg-secondary/20 border-t border-border/50">
                <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-8">
                     <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Deuda Original:</span>
                        <span className="text-xl font-bold font-mono text-muted-foreground">
                            {formatCurrency(totalOriginalDebt)}
                        </span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground">Deuda Pendiente:</span>
                        <span className="text-2xl font-bold font-mono text-primary">
                            {formatCurrency(totalPendingDebt)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function InstallmentRow({ installment }: { installment: AccountInstallment }) {
    const config = statusConfig[installment.status];
    const StatusIcon = config.icon;

    // Determine badge variant style manually if 'success' isn't supported by default UI lib
    const badgeVariant = config.variant === 'success' ? 'default' : config.variant as any;
    const badgeClassName = config.variant === 'success' ? 'bg-green-600 hover:bg-green-700' : '';

    return (
        <TableRow className="hover:bg-secondary/10 transition-colors">
            <TableCell className="font-semibold">
                Cuota {installment.period}
            </TableCell>
            <TableCell>
                {new Date(installment.dueDate).toLocaleDateString('es-PE', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })}
            </TableCell>
            <TableCell className="text-right font-mono">
                {formatCurrency(installment.originalAmount)}
            </TableCell>
            <TableCell className="text-right font-mono">
                <div className="flex items-center justify-end gap-2">
                    <span className={installment.pendingBalance > 0 ? 'text-destructive font-semibold' : 'text-muted-foreground'}>
                        {formatCurrency(installment.pendingBalance)}
                    </span>
                    {installment.hasPartialPayment && installment.pendingBalance > 0 && (
                        <Tooltip>
                            <TooltipTrigger>
                                <Info className="h-4 w-4 text-primary cursor-help" />
                            </TooltipTrigger>
                            <TooltipContent className="max-w-xs bg-popover">
                                <p className="font-semibold mb-1">Pago parcial realizado</p>
                                <p className="text-sm text-muted-foreground">
                                    Abono de {formatCurrency(installment.partialPaymentAmount || 0)}.
                                </p>
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            </TableCell>
            <TableCell>
                <Badge
                    variant={badgeVariant}
                    className={cn("gap-1.5", badgeClassName)}
                >
                    <StatusIcon className="h-3 w-3" />
                    {config.label}
                </Badge>
            </TableCell>
            <TableCell className="text-right font-mono">
                {installment.generatedInterest > 0 ? (
                    <span className="text-destructive font-semibold">
                        +{formatCurrency(installment.generatedInterest)}
                    </span>
                ) : (
                    <span className="text-muted-foreground">—</span>
                )}
            </TableCell>
        </TableRow>
    );
}