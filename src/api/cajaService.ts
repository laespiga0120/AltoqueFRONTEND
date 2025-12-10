import apiClient from './apiClient';
import { Caja, Transaction } from '@/types/operations';

export const cajaService = {
  // Abrir la caja
  // CORRECCIÓN: Agregado el prefijo '/api'
  abrirCaja: async (saldoInicial: number): Promise<Caja> => {
    const response = await apiClient<Caja>('/api/caja/abrir', { 
      body: { saldo: saldoInicial } 
    });
    return response;
  },

  // Obtener estado actual
  // CORRECCIÓN: Agregado el prefijo '/api'
  obtenerCajaActual: async (): Promise<Caja> => {
    const response = await apiClient<Caja>('/api/caja/actual');
    return response;
  },

  // Obtener lista de movimientos
  // CORRECCIÓN: Agregado el prefijo '/api'
  obtenerMovimientos: async (): Promise<Transaction[]> => {
    const response = await apiClient<Transaction[]>('/api/caja/movimientos');
    return response;
  },

  // Cerrar la caja
  // CORRECCIÓN: Agregado el prefijo '/api'
  cerrarCaja: async (saldoFinalReal: number): Promise<Caja> => {
    const response = await apiClient<Caja>('/api/caja/cerrar', { 
      body: { saldo: saldoFinalReal } 
    });
    return response;
  }
};