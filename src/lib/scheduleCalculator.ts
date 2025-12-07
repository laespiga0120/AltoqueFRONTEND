// Usamos la interfaz que definiste en tus tipos
import { PaymentInstallment } from "../types/loan";

export function calculateLoanSchedule(
  amount: number,
  annualInterestRate: number,
  startDate: string,
  installments: number = 1
): PaymentInstallment[] {
  const monthlyInterestRate = annualInterestRate / 12 / 100;

  // Calculamos la cuota de referencia con todos sus decimales
  const monthlyPayment =
    (amount *
      (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, installments))) /
    (Math.pow(1 + monthlyInterestRate, installments) - 1);

  // Esta es la cuota que se pagará la mayoría de los meses
  const roundedMonthlyPayment = Math.round(monthlyPayment * 100) / 100;

  const schedule: PaymentInstallment[] = [];
  let remainingBalance = amount;

  for (let i = 1; i <= installments; i++) {
    const interestForMonth = remainingBalance * monthlyInterestRate;

    // La cuota es la redondeada, excepto en el último mes
    let paymentForMonth = roundedMonthlyPayment;

    // Ajuste para la última cuota para asegurar que el saldo sea 0
    if (i === installments) {
      paymentForMonth = remainingBalance + interestForMonth;
    }

    const principalForMonth = paymentForMonth - interestForMonth;
    remainingBalance -= principalForMonth;

    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    // Creamos el objeto de la cuota con la estructura que necesitas
    schedule.push({
      installmentNumber: i,
      dueDate: dueDate.toISOString().split("T")[0],
      amount: Math.round(paymentForMonth * 100) / 100,
    });
  }

  // Ahora la función devuelve directamente el array del cronograma
  return schedule;
}
