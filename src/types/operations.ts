export type PaymentStatus = 'current' | 'stopped_interest' | 'overdue';
export type PaymentMethod = 'cash' | 'yape' | 'plin' | 'card';
export type TransactionType = 'payment' | 'opening' | 'closing' | 'adjustment';

export interface AccountInstallment {
    period: number;
    dueDate: string;
    originalAmount: number;
    pendingBalance: number;
    status: PaymentStatus;
    generatedInterest: number;
    hasPartialPayment: boolean;
    partialPaymentAmount?: number;
}

export interface ClientAccount {
    clientDNI: string;
    clientName: string;
    loanId: string;
    totalDebt: number;
    currentMonthPayment: number;
    previousPendingBalance: number;
    installments: AccountInstallment[];
}

export interface Transaction {
    id: string;
    timestamp: string;
    clientDNI: string;
    clientName: string;
    type: TransactionType;
    method: PaymentMethod;
    systemAmount: number;
    roundingAdjustment: number;
    realAmount: number;
    installmentsPaid: number[];
    operatorId?: string;
}

export interface CashRegisterSummary {
    openingBalance: number;
    cashEntries: number;
    roundingAdjustment: number;
    digitalEntries: number;
    theoreticalTotal: number;
    transactions: Transaction[];
    date: string;
    status: 'open' | 'closed';
}

export interface ClosureResult {
    countedCash: number;
    theoreticalCash: number;
    difference: number;
    isBalanced: boolean;
    closedAt: string;
    closedBy: string;
}