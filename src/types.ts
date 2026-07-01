export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO yyyy-mm-dd
  createdAt: number; // epoch ms, used for stable sort order
}

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;

export type Tab = "dashboard" | "add" | "daily" | "summary";
