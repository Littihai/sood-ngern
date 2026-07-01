export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  note: string;
  date: string; // ISO yyyy-mm-dd
  createdAt: number; // epoch ms, used for stable sort order
  createdByUid?: string;
  createdByName?: string;
  createdByPhotoURL?: string;
}

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;

export interface BookMember {
  name: string;
  photoURL: string;
  role: "owner" | "member";
  joinedAt: number;
}

export interface SharedBook {
  id: string;
  name: string;
  ownerUid: string;
  ownerName: string;
  joinPassword: string;
  memberIds: string[];
  members: Record<string, BookMember>;
  createdAt: number;
  updatedAt: number;
}

export type ActiveBook =
  | { kind: "personal"; id: string; name: string; ownerUid: string }
  | ({ kind: "shared" } & SharedBook);

export type Tab = "dashboard" | "add" | "daily" | "summary" | "profile";
