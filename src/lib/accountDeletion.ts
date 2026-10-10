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
import { transactionsToCsv } from "./csv";

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
  return transactionsToCsv(snap.docs.map((d) => d.data() as Transaction));
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
      // Member: keep the shared history but remove the person's identity (whatever their role is
      // now — a former editor demoted to viewer may still own entries), then leave.
      await anonymizeTransactions(book.id, uid);
      await updateDoc(doc(db, "books", book.id), {
        memberIds: arrayRemove(uid),
        [`members.${uid}`]: deleteField(),
        updatedAt: Date.now(),
      });
    }
  }

  // Withdraw every join request this user sent — they carry the user's name and photo into
  // other people's books. The list lives in Firestore, so it is complete on any device.
  const refs = collection(db, "users", uid, "joinRequestRefs");
  const refSnap = await getDocs(refs);
  const bookIds = new Set(refSnap.docs.map((d) => d.id));
  try {
    // ids saved by an older version that were never migrated
    JSON.parse(window.localStorage.getItem(`sood-ngern-join-requests-${uid}`) || "[]").forEach((id: string) => bookIds.add(id));
  } catch {
    // unreadable local list — the Firestore list is authoritative
  }
  await Promise.all([...bookIds].map((id) => deleteDoc(doc(db, "books", id, "joinRequests", uid)).catch(() => undefined)));
  await purgeCollection(refs);
}
