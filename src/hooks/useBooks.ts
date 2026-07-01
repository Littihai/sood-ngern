import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { ActiveBook, BookMember, SharedBook } from "../types";

type Profile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

const activeBookKey = (uid: string) => `sood-ngern-active-book-${uid}`;
const rememberedBookPasswordsKey = "sood-ngern-book-passwords";

function memberFromProfile(profile?: Profile): BookMember {
  return {
    name: profile?.displayName || profile?.email || "Unknown user",
    photoURL: profile?.photoURL || "",
    role: "member",
    joinedAt: Date.now(),
  };
}

function rememberBookPassword(bookId: string, password: string) {
  if (typeof window === "undefined") return;
  const raw = window.localStorage.getItem(rememberedBookPasswordsKey);
  const entries = raw ? (JSON.parse(raw) as Record<string, string>) : {};
  entries[bookId] = password;
  window.localStorage.setItem(rememberedBookPasswordsKey, JSON.stringify(entries));
}

function getRememberedBookPassword(bookId: string) {
  if (typeof window === "undefined") return "";
  const raw = window.localStorage.getItem(rememberedBookPasswordsKey);
  if (!raw) return "";
  const entries = JSON.parse(raw) as Record<string, string>;
  return entries[bookId] || "";
}

export function useBooks(uid: string | undefined, profile?: Profile) {
  const personalBook = useMemo<ActiveBook | null>(
    () => (uid ? { kind: "personal", id: uid, name: "Personal book", ownerUid: uid } : null),
    [uid]
  );
  const [sharedBooks, setSharedBooks] = useState<SharedBook[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setSharedBooks([]);
      setLoaded(true);
      setActiveBookId(null);
      return;
    }
    setActiveBookId(window.localStorage.getItem(activeBookKey(uid)) || `personal:${uid}`);
    setLoaded(false);
    const q = query(collection(db, "books"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const books = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as SharedBook))
          .sort((a, b) => b.updatedAt - a.updatedAt);
        setSharedBooks(books);
        setLoaded(true);
      },
      (err) => {
        console.error("books listener failed", err);
        setLoaded(true);
      }
    );
    return unsub;
  }, [uid]);

  const books = useMemo(() => {
    return personalBook ? [personalBook, ...sharedBooks.map((book) => ({ ...book, kind: "shared" as const }))] : [];
  }, [personalBook, sharedBooks]);

  const activeBook = useMemo<ActiveBook | null>(() => {
    if (!personalBook) return null;
    const found = books.find((book) => `${book.kind}:${book.id}` === activeBookId);
    return found || personalBook;
  }, [activeBookId, books, personalBook]);

  const selectBook = useCallback(
    (book: ActiveBook) => {
      if (!uid) return;
      const key = `${book.kind}:${book.id}`;
      window.localStorage.setItem(activeBookKey(uid), key);
      setActiveBookId(key);
    },
    [uid]
  );

  const createSharedBook = useCallback(
    async (name: string, password: string, rememberPassword: boolean) => {
      if (!uid) return;
      const cleanName = name.trim();
      const cleanPassword = password.trim();
      if (!cleanName || cleanPassword.length < 4) return;
      const ownerMember = { ...memberFromProfile(profile), role: "owner" as const };
      const createdAt = Date.now();
      const ref = await addDoc(collection(db, "books"), {
        name: cleanName,
        ownerUid: uid,
        ownerName: ownerMember.name,
        joinPassword: cleanPassword,
        memberIds: [uid],
        members: {
          [uid]: ownerMember,
        },
        createdAt,
        updatedAt: createdAt,
      });
      const optimisticBook: SharedBook = {
        id: ref.id,
        name: cleanName,
        ownerUid: uid,
        ownerName: ownerMember.name,
        joinPassword: cleanPassword,
        memberIds: [uid],
        members: {
          [uid]: ownerMember,
        },
        createdAt,
        updatedAt: createdAt,
      };
      setSharedBooks((prev) => [optimisticBook, ...prev.filter((book) => book.id !== ref.id)]);
      if (rememberPassword) {
        rememberBookPassword(ref.id, cleanPassword);
      }
      const key = `shared:${ref.id}`;
      window.localStorage.setItem(activeBookKey(uid), key);
      setActiveBookId(key);
    },
    [uid, profile]
  );

  const joinSharedBook = useCallback(
    async (bookId: string, password: string, rememberPassword: boolean) => {
      if (!uid) return;
      const cleanBookId = bookId.trim();
      const cleanPassword = password.trim();
      if (!cleanBookId || !cleanPassword) return;
      const member = memberFromProfile(profile);
      await updateDoc(doc(db, "books", cleanBookId), {
        memberIds: arrayUnion(uid),
        [`members.${uid}`]: member,
        updatedAt: Date.now(),
      });
      const snap = await getDoc(doc(db, "books", cleanBookId));
      if (snap.exists()) {
        const data = snap.data() as Omit<SharedBook, "id">;
        setSharedBooks((prev) => [
          { id: snap.id, ...data },
          ...prev.filter((book) => book.id !== snap.id),
        ]);
      }
      if (rememberPassword) {
        rememberBookPassword(cleanBookId, cleanPassword);
      }
      const key = `shared:${cleanBookId}`;
      window.localStorage.setItem(activeBookKey(uid), key);
      setActiveBookId(key);
    },
    [uid, profile]
  );

  return {
    books,
    sharedBooks,
    activeBook,
    loaded,
    selectBook,
    createSharedBook,
    joinSharedBook,
    getRememberedBookPassword,
  };
}
