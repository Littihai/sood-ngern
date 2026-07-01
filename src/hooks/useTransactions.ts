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

export function useTransactions(
  uid: string | undefined,
  activeBook: ActiveBook | null,
  profile?: { displayName: string | null; email: string | null; photoURL: string | null }
) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);

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
            createdByName: tx.createdByName || profile?.displayName || profile?.email || "Unknown user",
            createdByPhotoURL: tx.createdByPhotoURL || profile?.photoURL || "",
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
  }, [uid, activeBook, profile?.displayName, profile?.email, profile?.photoURL]);

  const addTransaction = useCallback(
    async (tx: NewTransaction) => {
      if (!uid || !activeBook) return;
      const txCollection =
        activeBook.kind === "personal"
          ? collection(db, "users", uid, "transactions")
          : collection(db, "books", activeBook.id, "transactions");
      await addDoc(txCollection, {
        ...tx,
        createdAt: Date.now(),
        createdByUid: uid,
        createdByName: profile?.displayName || profile?.email || "Unknown user",
        createdByPhotoURL: profile?.photoURL || "",
      });
    },
    [uid, activeBook, profile?.displayName, profile?.email, profile?.photoURL]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!uid || !activeBook) return;
      const txDoc =
        activeBook.kind === "personal"
          ? doc(db, "users", uid, "transactions", id)
          : doc(db, "books", activeBook.id, "transactions", id);
      await deleteDoc(txDoc);
    },
    [uid, activeBook]
  );

  return { transactions, loaded, addTransaction, deleteTransaction };
}
