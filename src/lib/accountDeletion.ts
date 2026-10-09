import {
  arrayRemove,
  collection,
  CollectionReference,
  deleteDoc,
  deleteField,
  doc,
  getDocs,
  limit,
  query,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { SharedBook, Transaction } from "../types";

/** Shown in shared ledgers in place of a deleted user's name. */
export const DELETED_USER_NAME = "ผู้ใช้ที่ลบบัญชี";

const BATCH_SIZE = 400; // Firestore allows 500 writes per batch; keep headroom.

export type DeletionStep = "reauth" | "personal" | "books" | "account";

export interface DeletionPlan {
  /** Books the user owns: they are deleted for everyone. */
  ownedBooks: { id: string; name: string; memberCount: number }[];
  /** Books the user only belongs to: the user is removed, the book survives. */
  joinedBooks: { id: string; name: string; role: SharedBook["members"][string]["role"] }[];
  personalCount: number;
}

type BookRow = SharedBook & { id: string };

async function loadMyBooks(uid: string): Promise<BookRow[]> {
  // Members-only query (required by the security rules). Includes soft-deleted books.
  const snap = await getDocs(query(collection(db, "books"), where("memberIds", "array-contains", uid)));
  return snap.docs.map((d) => ({ ...(d.data() as SharedBook), id: d.id }));
}

/** Read-only summary used by the confirmation dialog — nothing is changed here. */
export async function planAccountDeletion(uid: string): Promise<DeletionPlan> {
  const [books, personal] = await Promise.all([
    loadMyBooks(uid),
    getDocs(collection(db, "users", uid, "transactions")),
  ]);
  const live = books.filter((b) => !b.deleted);
  return {
    ownedBooks: live
      .filter((b) => b.ownerUid === uid)
      .map((b) => ({ id: b.id, name: b.name, memberCount: b.memberIds.length })),
    joinedBooks: live
      .filter((b) => b.ownerUid !== uid)
      .map((b) => ({ id: b.id, name: b.name, role: b.members[uid]?.role ?? "viewer" })),
    personalCount: personal.size,
  };
}

/** Personal transactions as a CSV (UTF-8 with BOM so Excel shows Thai correctly). */
export async function exportPersonalCsv(uid: string): Promise<string> {
  const snap = await getDocs(collection(db, "users", uid, "transactions"));
  const rows = snap.docs
    .map((d) => d.data() as Transaction)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const esc = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;
  const lines = [["date", "type", "category", "amount", "note"].join(",")].concat(
    rows.map((t) => [t.date, t.type, t.category, t.amount, t.note].map(esc).join(","))
  );
  return "﻿" + lines.join("\r\n");
}

/** Deletes every document of a (sub)collection in batches. */
async function purgeCollection(col: CollectionReference) {
  for (;;) {
    const snap = await getDocs(query(col, limit(BATCH_SIZE)));
    if (snap.empty) return;
    const batch = writeBatch(db);
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/** Replaces the user's name/photo on transactions they wrote in a shared book. */
async function anonymizeTransactions(bookId: string, uid: string) {
  const snap = await getDocs(query(collection(db, "books", bookId, "transactions"), where("createdByUid", "==", uid)));
  for (let i = 0; i < snap.docs.length; i += BATCH_SIZE) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + BATCH_SIZE).forEach((d) => batch.update(d.ref, { createdByName: DELETED_USER_NAME, createdByPhotoURL: "" }));
    await batch.commit();
  }
}

/**
 * Removes everything the user owns in Firestore. Safe to re-run: every step is
 * idempotent, so a failed attempt can simply be retried.
 *
 * Order matters — shared-book cleanup needs the user to still be signed in,
 * so the Auth account itself is deleted by the caller afterwards.
 */
export async function purgeUserData(uid: string, onStep: (step: DeletionStep) => void): Promise<void> {
  onStep("personal");
  await purgeCollection(collection(db, "users", uid, "transactions"));

  onStep("books");
  const books = await loadMyBooks(uid);
  for (const book of books) {
    if (book.ownerUid === uid) {
      // Owner: hard-delete the book with its transactions and join requests.
      await purgeCollection(collection(db, "books", book.id, "transactions"));
      await purgeCollection(collection(db, "books", book.id, "joinRequests"));
      await deleteDoc(doc(db, "books", book.id));
    } else {
      // Member: keep the shared history but remove the person's identity, then leave.
      if (book.members[uid]?.role === "editor" && !book.deleted) await anonymizeTransactions(book.id, uid);
      await updateDoc(doc(db, "books", book.id), {
        memberIds: arrayRemove(uid),
        [`members.${uid}`]: deleteField(),
        updatedAt: Date.now(),
      });
    }
  }

  // Withdraw join requests this user sent that are still waiting (best effort).
  try {
    const raw = window.localStorage.getItem(`sood-ngern-join-requests-${uid}`);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    await Promise.all(ids.map((id) => deleteDoc(doc(db, "books", id, "joinRequests", uid)).catch(() => undefined)));
  } catch {
    // local list unreadable — nothing to withdraw
  }
}
