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

export type BookRole = "owner" | "editor" | "viewer";

export interface BookMember {
  name: string;
  photoURL: string;
  role: BookRole;
  joinedAt: number;
}

export interface JoinRequest {
  id: string;
  bookId: string;
  bookName?: string;
  requesterUid: string;
  requesterName: string;
  requesterPhotoURL: string;
  requestedAt: number;
  role: BookRole;
  status: "pending" | "approved" | "rejected";
  joinPassword?: string;
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
