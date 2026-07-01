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
import { NewTransaction, Transaction } from "../types";

export function useTransactions(uid: string | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!uid) {
      setTransactions([]);
      setLoaded(true);
      return;
    }
    setLoaded(false);
    const q = query(
      collection(db, "users", uid, "transactions"),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Transaction));
        setTransactions(rows);
        setLoaded(true);
      },
      (err) => {
        console.error("transactions listener failed", err);
        setLoaded(true);
      }
    );
    return unsub;
  }, [uid]);

  const addTransaction = useCallback(
    async (tx: NewTransaction) => {
      if (!uid) return;
      await addDoc(collection(db, "users", uid, "transactions"), {
        ...tx,
        createdAt: Date.now(),
      });
    },
    [uid]
  );

  const deleteTransaction = useCallback(
    async (id: string) => {
      if (!uid) return;
      await deleteDoc(doc(db, "users", uid, "transactions", id));
    },
    [uid]
  );

  return { transactions, loaded, addTransaction, deleteTransaction };
}
