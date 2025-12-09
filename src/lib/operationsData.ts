import { ClientAccount, Transaction, CashRegisterSummary, AccountInstallment } from '@/types/operations';

// Interest rate for overdue payments (1% monthly)
export const MORA_RATE = 0.01;

// Mock client accounts with payment status
export const MOCK_CLIENT_ACCOUNTS: ClientAccount[] = [
    {
        clientDNI: '12345678',
        clientName: 'Juan Carlos Vilca Jimenez',
        loanId: '1',
        totalDebt: 3245.50, // This is legacy, will be calculated dynamically in UI but kept for now
        currentMonthPayment: 1050.00,
        previousPendingBalance: 195.50,
        installments: [
            {
                period: 1,
                dueDate: '2024-11-10',
                originalAmount: 1050.00,
                pendingBalance: 195.50 + 1.95, // 195.50 remaining + 1% mora
                status: 'overdue', 
                generatedInterest: 1.95, // 1% of 195.50
                hasPartialPayment: true,
                partialPaymentAmount: 854.50,
            },
            {
                period: 2,
                dueDate: '2024-12-10',
                originalAmount: 1050.00,
                pendingBalance: 1050.00,
                status: 'current',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
            {
                period: 3,
                dueDate: '2025-01-10',
                originalAmount: 1050.00,
                pendingBalance: 1050.00,
                status: 'pending',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
        ],
    },
    {
        clientDNI: '45678901',
        clientName: 'Maria Elena Rodriguez Torres',
        loanId: '2',
        totalDebt: 5832.40,
        currentMonthPayment: 875.00,
        previousPendingBalance: 882.40,
        installments: [
            {
                period: 1,
                dueDate: '2024-10-15',
                originalAmount: 875.00,
                pendingBalance: 0,
                status: 'paid',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
            {
                period: 2,
                dueDate: '2024-11-15',
                originalAmount: 875.00,
                pendingBalance: 875.00 + 8.75,
                status: 'overdue',
                generatedInterest: 8.75, // 1% of 875
                hasPartialPayment: false,
            },
            {
                period: 3,
                dueDate: '2024-12-15',
                originalAmount: 875.00,
                pendingBalance: 875.00,
                status: 'current',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
            {
                period: 4,
                dueDate: '2025-01-15',
                originalAmount: 875.00,
                pendingBalance: 875.00,
                status: 'pending',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
        ],
    },
    {
        clientDNI: '01234567',
        clientName: 'Diego Fabian Escobedo Bopp',
        loanId: '3',
        totalDebt: 0,
        currentMonthPayment: 0,
        previousPendingBalance: 0,
        installments: [],
    },
    {
        clientDNI: '10987654',
        clientRUC: '20123456789',
        clientName: 'Empresa de Transportes S.A.C.',
        loanId: '4',
        totalDebt: 1500.00,
        currentMonthPayment: 500.00,
        previousPendingBalance: 0,
        installments: [
             {
                period: 1,
                dueDate: '2025-01-20',
                originalAmount: 500.00,
                pendingBalance: 500.00,
                status: 'current',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
            {
                period: 2,
                dueDate: '2025-02-20',
                originalAmount: 500.00,
                pendingBalance: 500.00,
                status: 'current',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
            {
                period: 3,
                dueDate: '2025-03-20',
                originalAmount: 500.00,
                pendingBalance: 500.00,
                status: 'current',
                generatedInterest: 0,
                hasPartialPayment: false,
            },
        ],
    },
];

// Today's transactions for cash register
export const MOCK_TRANSACTIONS: Transaction[] = [
    {
        id: 'tx-001',
        timestamp: '2025-12-07T08:00:00',
        clientDNI: 'SYSTEM',
        clientName: 'Apertura de Caja',
        type: 'opening',
        method: 'cash',
        systemAmount: 500.00,
        roundingAdjustment: 0,
        realAmount: 500.00,
        installmentsPaid: [],
        operatorId: 'admin',
    },
    {
        id: 'tx-002',
        timestamp: '2025-12-07T09:15:32',
        clientDNI: '87654321',
        clientName: 'Pedro Sanchez Lima',
        type: 'payment',
        method: 'cash',
        systemAmount: 523.47,
        roundingAdjustment: 0.03,
        realAmount: 523.50,
        installmentsPaid: [1],
        operatorId: 'admin',
    },
    {
        id: 'tx-003',
        timestamp: '2025-12-07T10:22:15',
        clientDNI: '11223344',
        clientName: 'Rosa Martinez Diaz',
        type: 'payment',
        method: 'yape',
        systemAmount: 1250.00,
        roundingAdjustment: 0,
        realAmount: 1250.00,
        installmentsPaid: [2, 3],
        operatorId: 'admin',
    },
    {
        id: 'tx-004',
        timestamp: '2025-12-07T11:45:08',
        clientDNI: '55667788',
        clientName: 'Carlos Gomez Ruiz',
        type: 'payment',
        method: 'cash',
        systemAmount: 875.23,
        roundingAdjustment: -0.03,
        realAmount: 875.20,
        installmentsPaid: [1],
        operatorId: 'admin',
    },
    {
        id: 'tx-005',
        timestamp: '2025-12-07T14:30:00',
        clientDNI: '99887766',
        clientName: 'Ana Lucia Fernandez',
        type: 'payment',
        method: 'plin',
        systemAmount: 650.00,
        roundingAdjustment: 0,
        realAmount: 650.00,
        installmentsPaid: [1],
        operatorId: 'admin',
    },
    {
        id: 'tx-006',
        timestamp: '2025-12-07T15:12:45',
        clientDNI: '44556677',
        clientName: 'Miguel Torres Paz',
        type: 'payment',
        method: 'cash',
        systemAmount: 1100.57,
        roundingAdjustment: -0.07,
        realAmount: 1100.50,
        installmentsPaid: [2],
        operatorId: 'admin',
    },
];

export function getCashRegisterSummary(): CashRegisterSummary {
    const cashTransactions = MOCK_TRANSACTIONS.filter(t => t.method === 'cash' && t.type === 'payment');
    const digitalTransactions = MOCK_TRANSACTIONS.filter(t => ['yape', 'plin', 'card'].includes(t.method));
    const openingTx = MOCK_TRANSACTIONS.find(t => t.type === 'opening');

    const openingBalance = openingTx?.realAmount || 0;
    const cashEntries = cashTransactions.reduce((sum, t) => sum + t.realAmount, 0);
    const roundingAdjustment = cashTransactions.reduce((sum, t) => sum + t.roundingAdjustment, 0);
    const digitalEntries = digitalTransactions.reduce((sum, t) => sum + t.realAmount, 0);

    return {
        openingBalance,
        cashEntries,
        roundingAdjustment,
        digitalEntries,
        theoreticalTotal: openingBalance + cashEntries,
        transactions: MOCK_TRANSACTIONS,
        date: '2025-12-07',
        status: 'open',
    };
}

export function searchClients(query: string): ClientAccount[] {
    const normalizedQuery = query.toLowerCase().trim();
    if (!normalizedQuery) return [];

    return MOCK_CLIENT_ACCOUNTS.filter(
        client =>
            client.clientDNI.includes(normalizedQuery) ||
            (client.clientRUC && client.clientRUC.includes(normalizedQuery)) ||
            client.clientName.toLowerCase().includes(normalizedQuery)
    );
}

export function calculateRounding(amount: number): { adjustment: number; rounded: number } {
    const cents = Math.round((amount % 1) * 100);
    const lastDigit = cents % 10;

    let adjustment = 0;
    if (lastDigit >= 1 && lastDigit <= 4) {
        adjustment = -lastDigit / 100;
    } else if (lastDigit >= 6 && lastDigit <= 9) {
        adjustment = (10 - lastDigit) / 100;
    }

    const rounded = Math.round((amount + adjustment) * 100) / 100;
    return { adjustment: Math.round(adjustment * 100) / 100, rounded };
}

export function formatCurrency(amount: number): string {
    return `S/ ${amount.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}