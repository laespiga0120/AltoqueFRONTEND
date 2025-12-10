import { Transaction, CashRegisterSummary } from '@/types/operations';

// Tasa de interés mensual (Referencial)
export const MORA_RATE = 0.01;

const STORAGE_KEY = 'cash_register_transactions';

function getStoredTransactions(): Transaction[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Transacciones de Caja (Mock local temporal para la funcionalidad visual de caja)
export let MOCK_TRANSACTIONS: Transaction[] = getStoredTransactions();

export function openCashRegister(initialBalance: number, operatorId: string) {
    const openingTx: Transaction = {
        id: `tx-${Date.now()}`,
        timestamp: new Date().toISOString(),
        clientDNI: 'SYSTEM',
        clientName: 'Apertura de Caja',
        type: 'opening',
        method: 'cash',
        systemAmount: initialBalance,
        roundingAdjustment: 0,
        realAmount: initialBalance,
        installmentsPaid: [],
        operatorId: operatorId,
    };
    
    // Si ya hay una apertura hoy (o la última no se cerró), esto resetearía "lógicamente" 
    // Para simplificar, asumimos que "abrir" limpia transacciones anteriores o empieza una nueva sesión
    // En un sistema real, esto sería gestionado por IDs de sesión de caja.
    // Aquí, limpiamos si vamos a abrir de nuevo para evitar acumulación infinita en demo
    
    // Si la caja está cerrada (no hay opening o hay un cierre posterior), iniciamos limpio
    const currentStatus = getCashRegisterSummary().status;
    
    // Logic: If we are opening, we assume a fresh day for this local-first approach
    if (localStorage.getItem('cash_register_status') !== 'open') {
         MOCK_TRANSACTIONS = [openingTx];
    } else {
         // Should not happen if UI is correct, but safe fallback
         MOCK_TRANSACTIONS.push(openingTx);
    }

    saveTransactions(MOCK_TRANSACTIONS);
    localStorage.setItem('cash_register_status', 'open');
    return openingTx;
}

export function closeCashRegister() {
    localStorage.setItem('cash_register_status', 'closed');
}

export function isCashRegisterOpen(): boolean {
    return localStorage.getItem('cash_register_status') === 'open';
}

export function getCashRegisterSummary(): CashRegisterSummary {
    // Reload from storage to ensure freshness
    MOCK_TRANSACTIONS = getStoredTransactions();
    
    const cashTransactions = MOCK_TRANSACTIONS.filter(t => t.method === 'cash' && t.type === 'payment');
    const digitalTransactions = MOCK_TRANSACTIONS.filter(t => ['yape', 'plin', 'card'].includes(t.method));
    const openingTx = MOCK_TRANSACTIONS.find(t => t.type === 'opening');

    const openingBalance = openingTx?.realAmount || 0;
    const cashEntries = cashTransactions.reduce((sum, t) => sum + t.realAmount, 0);
    const roundingAdjustment = cashTransactions.reduce((sum, t) => sum + t.roundingAdjustment, 0);
    const digitalEntries = digitalTransactions.reduce((sum, t) => sum + t.realAmount, 0);
    
    const status = localStorage.getItem('cash_register_status') as 'open' | 'closed' || 'closed';

    return {
        openingBalance,
        cashEntries,
        roundingAdjustment,
        digitalEntries,
        theoreticalTotal: openingBalance + cashEntries,
        transactions: MOCK_TRANSACTIONS,
        date: openingTx?.timestamp || new Date().toISOString(),
        status: status,
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