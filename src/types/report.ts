export interface BrandSettings {
  companyName: string;
  logoBase64: string | null;
  primaryColor: string;
  reportPeriod: string;
  ownerName: string;
}

export interface RawTransaction {
  property: string;
  date: string;
  category: string;
  description: string;
  type: 'Income' | 'Expense' | 'Distribution';
  amount: number;
}

export interface ColumnMapping {
  property: string;
  date: string;
  category: string;
  description: string;
  type: string;
  amount: string;
}

export interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netOperatingIncome: number;
  totalDistributed: number;
  byProperty: { property: string; income: number; expenses: number; noi: number }[];
  expensesByCategory: { category: string; amount: number; percentage: number }[];
  transactions: RawTransaction[];
}
