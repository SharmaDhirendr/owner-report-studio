import type { RawTransaction, ReportSummary } from '@/types/report';

function toCents(num: number): number {
  return Math.round(num * 100) / 100;
}

export function calculateReportSummary(transactions: RawTransaction[]): ReportSummary {
  let totalIncome = 0;
  let totalExpenses = 0;
  let totalDistributed = 0;

  const propertyTotals = new Map<string, { income: number; expenses: number }>();
  const expenseTotals = new Map<string, number>();

  for (const transaction of transactions) {
    const property = propertyTotals.get(transaction.property) ?? { income: 0, expenses: 0 };

    if (transaction.type === 'Income') {
      totalIncome += transaction.amount;
      property.income += transaction.amount;
    } else if (transaction.type === 'Expense') {
      totalExpenses += transaction.amount;
      property.expenses += transaction.amount;
      expenseTotals.set(
        transaction.category,
        (expenseTotals.get(transaction.category) ?? 0) + transaction.amount,
      );
    } else {
      totalDistributed += transaction.amount;
    }

    propertyTotals.set(transaction.property, property);
  }

  const roundedIncome = toCents(totalIncome);
  const roundedExpenses = toCents(totalExpenses);

  const expensesByCategory = Array.from(expenseTotals.entries())
    .map(([category, amount]) => ({
      category,
      amount: toCents(amount),
      percentage: totalExpenses === 0 ? 0 : toCents((amount / totalExpenses) * 100),
    }))
    .sort((a, b) => b.amount - a.amount);

  return {
    totalIncome: roundedIncome,
    totalExpenses: roundedExpenses,
    netOperatingIncome: toCents(roundedIncome - roundedExpenses),
    totalDistributed: toCents(totalDistributed),
    byProperty: Array.from(propertyTotals.entries()).map(([property, totals]) => {
      const income = toCents(totals.income);
      const expenses = toCents(totals.expenses);
      return {
        property,
        income,
        expenses,
        noi: toCents(income - expenses),
      };
    }),
    expensesByCategory,
    transactions,
  };
}
