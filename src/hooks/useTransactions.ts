import { useEffect, useState, useCallback } from "react";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "../firebase";
import { ActiveBook, NewTransaction, Transaction } from "../types";
import { safeDisplayName, safePhotoURL } from "../lib/profile";

export function useTransactions(
  uid: string | undefined,
  activeBook: ActiveBook | null,
  profile?: { displayName: string | null; email: string | null; photoURL: string | null }
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);

  // Values that end up on every entry we write: always within the limits the rules accept.
  const authorName = safeDisplayName({ displayName: profile?.displayName, email: profile?.email });
  const authorPhoto = safePhotoURL(profile?.photoURL);

  useEffect(() => {
    if (!uid || !activeBook) {
      setTransactions([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const txCollection =
      activeBook.kind === "personal"
        ? collection(db, "users", uid, "transactions")
        : collection(db, "books", activeBook.id, "transactions");
    const q = query(
      txCollection,
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => {
          const tx = { id: d.id, ...d.data() } as Transaction;
          return {
            ...tx,
            createdByUid: tx.createdByUid || uid,
            createdByName: tx.createdByName || authorName,
            createdByPhotoURL: tx.createdByPhotoURL || authorPhoto,
          };
        });
        setTransactions(rows);
        setLoaded(true);
      },
      (err) => {
        console.error("transactions listener failed", err);
        setLoaded(true);
      }
    );
    return unsub;
  }, [uid, activeBook, authorName, authorPhoto]);

  const addTransaction = useCallback(
    async (tx: NewTransaction) => {
      if (!uid || !activeBook) return;
      const txCollection =
        activeBook.kind === "personal"
          ? collection(db, "users", uid, "transactions")
          : collection(db, "books", activeBook.id, "transactions");
      if (activeBook.kind === "shared") {
        const role = activeBook.members[uid]?.role || "viewer";
        if (role === "viewer") {
          throw new Error("คุณมีสิทธิ์ดูอย่างเดียวในสมุดนี้");
        }
      }
      await addDoc(txCollection, {
        ...tx,
        createdAt: Date.now(),
        createdByUid: uid,
        createdByName: authorName,
        createdByPhotoURL: authorPhoto,
      });
    },
    [uid, activeBook, authorName, authorPhoto]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!uid || !activeBook) return;
      const txDoc =
        activeBook.kind === "personal"
          ? doc(db, "users", uid, "transactions", id)
          : doc(db, "books", activeBook.id, "transactions", id);
      if (activeBook.kind === "shared") {
        const role = activeBook.members[uid]?.role || "viewer";
        if (role === "viewer") {
          throw new Error("คุณมีสิทธิ์ดูอย่างเดียวในสมุดนี้");
        }
      }
      await deleteDoc(txDoc);
    },
    [uid, activeBook]
  );

  return { transactions, loaded, addTransaction, deleteTransaction };
}
