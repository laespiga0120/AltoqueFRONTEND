import { CashRegisterSummary, Transaction } from '@/types/operations';

export const MORA_RATE = 0.01;

// --- Helpers de Formato ---
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('es-PE', {
        style: 'currency',
        currency: 'PEN',
    }).format(amount);
}

export function calculateRounding(amount: number): { rounded: number; adjustment: number } {
    const rounded = Math.round(amount * 10) / 10;
    const adjustment = Number((rounded - amount).toFixed(2));
    return { rounded, adjustment };
}

// --- Gestión Local de Caja (Legacy / Fallback) ---
const STORAGE_KEY = 'cash_register_transactions';
const STATUS_KEY = 'cash_register_status';

function getStoredTransactions(): Transaction[] {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
}

function saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

// Mock inicial
export let MOCK_TRANSACTIONS: Transaction[] = getStoredTransactions();

export function isCashRegisterOpen(): boolean {
    return localStorage.getItem(STATUS_KEY) === 'open';
}

export function openCashRegister(initialBalance: number, operatorId: string) {
    // Generamos un ID numérico simulado
    const newId = Date.now();
    
    const openingTx: Transaction = {
        id: newId,
        timestamp: new Date().toISOString(),
        clientDNI: '-', // Placeholder para cumplir el tipo
        clientName: 'Apertura de Caja',
        type: 'APERTURA', // ENUM correcto
        method: 'EFECTIVO', // ENUM correcto
        systemAmount: initialBalance,
        roundingAdjustment: 0,
        realAmount: initialBalance
    };

    // Si la caja no está abierta 'logicamente', reiniciamos mocks
    if (localStorage.getItem(STATUS_KEY) !== 'open') {
         MOCK_TRANSACTIONS = [openingTx];
    } else {
         MOCK_TRANSACTIONS.push(openingTx);
    }

    saveTransactions(MOCK_TRANSACTIONS);
    localStorage.setItem(STATUS_KEY, 'open');
    return openingTx;
}

export function closeCashRegister() {
    localStorage.setItem(STATUS_KEY, 'closed');
}

export function getCashRegisterSummary(): CashRegisterSummary {
    MOCK_TRANSACTIONS = getStoredTransactions();
    
    // Filtros ajustados a los nuevos valores de string (Mayúsculas)
    const cashTransactions = MOCK_TRANSACTIONS.filter(t => t.method === 'EFECTIVO' && t.type === 'PAGO');
    const digitalTransactions = MOCK_TRANSACTIONS.filter(t => ['YAPE', 'PLIN', 'TARJETA'].includes(t.method) && t.type === 'PAGO');
    const openingTx = MOCK_TRANSACTIONS.find(t => t.type === 'APERTURA');
    
    const openingBalance = openingTx ? openingTx.realAmount : 0;
    const cashEntries = cashTransactions.reduce((sum, t) => sum + t.realAmount, 0);
    const roundingAdjustment = cashTransactions.reduce((sum, t) => sum + t.roundingAdjustment, 0);
    const digitalEntries = digitalTransactions.reduce((sum, t) => sum + t.realAmount, 0);
    
    const status = (localStorage.getItem(STATUS_KEY) as 'open' | 'closed') || 'closed';

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
