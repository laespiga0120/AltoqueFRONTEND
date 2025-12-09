import { Transaction, CashRegisterSummary } from '@/types/operations';

// Tasa de interés mensual (Referencial)
export const MORA_RATE = 0.01;

// Transacciones de Caja (Mock local temporal para la funcionalidad visual de caja)
// TODO: Migrar a backend cuando se implemente el módulo de caja diario
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
    // Se pueden agregar más transacciones de prueba aquí si se necesita probar la UI de caja
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

// Utilidad de redondeo para efectivo (Soles peruanos)
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