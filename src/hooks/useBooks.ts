import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../firebase";
import { ActiveBook, BookMember, BookRole, JoinRequest, SharedBook } from "../types";

type Profile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

const activeBookKey = (uid: string) => `sood-ngern-active-book-${uid}`;
const bookListCacheKey = (uid: string) => `sood-ngern-books-${uid}`;
const rememberedBookPasswordsKey = "sood-ngern-book-passwords";

function memberFromProfile(profile?: Profile, role: BookRole = "viewer"): BookMember {
  return {
    name: profile?.displayName || profile?.email || "Unknown user",
    photoURL: profile?.photoURL || "",
    role,
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

function readCachedBooks(uid: string | undefined): SharedBook[] {
  if (!uid || typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(bookListCacheKey(uid));
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SharedBook[];
  } catch {
    return [];
  }
}

function writeCachedBooks(uid: string | undefined, books: SharedBook[]) {
  if (!uid || typeof window === "undefined") return;
  window.localStorage.setItem(bookListCacheKey(uid), JSON.stringify(books));
}

export function useBooks(uid: string | undefined, profile?: Profile) {
  const personalBook = useMemo<ActiveBook | null>(
    () => (uid ? { kind: "personal", id: uid, name: "Personal book", ownerUid: uid } : null),
    [uid]
  );
  const [sharedBooks, setSharedBooks] = useState<SharedBook[]>(() => readCachedBooks(uid));
  const [loaded, setLoaded] = useState(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);

  useEffect(() => {
    if (!uid) {
      setSharedBooks([]);
      setLoaded(true);
      setActiveBookId(null);
      return;
    }
    const storedKey = window.localStorage.getItem(activeBookKey(uid)) || `personal:${uid}`;
    const cachedBooks = readCachedBooks(uid);
    if (cachedBooks.length > 0) {
      setSharedBooks(cachedBooks);
    }
    setActiveBookId(storedKey);
    setLoaded(false);
    const q = query(collection(db, "books"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const books = snap.docs
          .map((d) => ({ id: d.id, ...d.data() } as SharedBook))
          .sort((a, b) => b.updatedAt - a.updatedAt);
        setSharedBooks(books);
        writeCachedBooks(uid, books);
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
    if (found?.kind === "shared") {
      const isAccessible = Boolean(uid && found.memberIds.includes(uid));
      if (!isAccessible) {
        if (uid && activeBookId !== `personal:${uid}`) {
          window.localStorage.setItem(activeBookKey(uid), `personal:${uid}`);
        }
        return personalBook;
      }
    }
    return found || personalBook;
  }, [activeBookId, books, personalBook, uid]);

  const selectBook = useCallback(
    (book: ActiveBook) => {
      if (!uid) return;
      if (book.kind === "shared" && !book.memberIds.includes(uid)) {
        return;
      }
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
      const ownerMember = { ...memberFromProfile(profile, "owner"), role: "owner" as const };
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
      setSharedBooks((prev) => {
        const next = [optimisticBook, ...prev.filter((book) => book.id !== ref.id)];
        writeCachedBooks(uid, next);
        return next;
      });
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

      const bookRef = doc(db, "books", cleanBookId);
      const snap = await getDoc(bookRef);
      if (!snap.exists()) {
        throw new Error("ไม่พบสมุดบัญชีนี้");
      }

      const data = snap.data() as SharedBook;
      if (data.memberIds.includes(uid)) {
        if (rememberPassword) {
          rememberBookPassword(cleanBookId, cleanPassword);
        }
        const key = `shared:${cleanBookId}`;
        window.localStorage.setItem(activeBookKey(uid), key);
        setActiveBookId(key);
        return;
      }

      if (data.joinPassword !== cleanPassword) {
        throw new Error("รหัสผ่านไม่ถูกต้อง");
      }

      await updateDoc(bookRef, {
        memberIds: arrayUnion(uid),
        [`members.${uid}`]: {
          name: profile?.displayName || profile?.email || "Unknown user",
          photoURL: profile?.photoURL || "",
          role: "viewer" as BookRole,
          joinedAt: Date.now(),
        },
        updatedAt: Date.now(),
      });

      if (rememberPassword) {
        rememberBookPassword(cleanBookId, cleanPassword);
      }

      const key = `shared:${cleanBookId}`;
      window.localStorage.setItem(activeBookKey(uid), key);
      setActiveBookId(key);
    },
    [uid, profile]
  );

  const approveJoinRequest = useCallback(async () => {
    return;
  }, []);

  const rejectJoinRequest = useCallback(async () => {
    return;
  }, []);

  const changeMemberRole = useCallback(
    async (bookId: string, targetUid: string, role: BookRole) => {
      if (!uid) return;
      const bookRef = doc(db, "books", bookId);
      const snap = await getDoc(bookRef);
      if (!snap.exists()) throw new Error("ไม่พบสมุดบัญชีนี้");
      const data = snap.data() as SharedBook;
      if (data.ownerUid !== uid) throw new Error("เฉพาะเจ้าของสมุดเท่านั้นที่เปลี่ยนสิทธิ์สมาชิกได้");
      if (targetUid === uid) throw new Error("ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้");
      await updateDoc(bookRef, {
        [`members.${targetUid}.role`]: role,
        updatedAt: Date.now(),
      });
    },
    [uid]
  );

  const removeMember = useCallback(
    async (bookId: string, targetUid: string) => {
      if (!uid) return;
      const bookRef = doc(db, "books", bookId);
      const snap = await getDoc(bookRef);
      if (!snap.exists()) throw new Error("ไม่พบสมุดบัญชีนี้");
      const data = snap.data() as SharedBook;
      if (data.ownerUid !== uid) throw new Error("เฉพาะเจ้าของสมุดเท่านั้นที่ลบสมาชิกได้");
      if (targetUid === uid) throw new Error("ไม่สามารถลบตัวเองจากสมุดได้ กรุณาใช้ออกจากสมุดบัญชี");
      await updateDoc(bookRef, {
        memberIds: arrayRemove(targetUid),
        [`members.${targetUid}`]: deleteField(),
        updatedAt: Date.now(),
      });
    },
    [uid]
  );

  const leaveBook = useCallback(
    async (bookId: string) => {
      if (!uid) return;
      const bookRef = doc(db, "books", bookId);
      const snap = await getDoc(bookRef);
      if (!snap.exists()) throw new Error("ไม่พบสมุดบัญชีนี้");
      const data = snap.data() as SharedBook;
      if (data.ownerUid === uid) throw new Error("เจ้าของสมุดต้องโอนสิทธิ์ก่อนออกจากสมุด");
      await updateDoc(bookRef, {
        memberIds: arrayRemove(uid),
        [`members.${uid}`]: deleteField(),
        updatedAt: Date.now(),
      });
      window.localStorage.setItem(activeBookKey(uid), `personal:${uid}`);
      setActiveBookId(`personal:${uid}`);
    },
    [uid]
  );

  const updateBookName = useCallback(
    async (bookId: string, name: string) => {
      if (!uid) return;
      const cleanName = name.trim();
      if (!cleanName) throw new Error("กรุณากรอกชื่อสมุดบัญชี");
      const bookRef = doc(db, "books", bookId);
      const snap = await getDoc(bookRef);
      if (!snap.exists()) throw new Error("ไม่พบสมุดบัญชีนี้");
      const data = snap.data() as SharedBook;
      if (data.ownerUid !== uid) throw new Error("เฉพาะเจ้าของสมุดเท่านั้นที่เปลี่ยนชื่อได้");
      await updateDoc(bookRef, { name: cleanName, updatedAt: Date.now() });
    },
    [uid]
  );

  const updateBookPassword = useCallback(
    async (bookId: string, password: string) => {
      if (!uid) return;
      const cleanPassword = password.trim();
      if (cleanPassword.length < 4) throw new Error("รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร");
      const bookRef = doc(db, "books", bookId);
      const snap = await getDoc(bookRef);
      if (!snap.exists()) throw new Error("ไม่พบสมุดบัญชีนี้");
      const data = snap.data() as SharedBook;
      if (data.ownerUid !== uid) throw new Error("เฉพาะเจ้าของสมุดเท่านั้นที่เปลี่ยนรหัสผ่านได้");
      await updateDoc(bookRef, { joinPassword: cleanPassword, updatedAt: Date.now() });
    },
    [uid]
  );

  const deleteBook = useCallback(
    async (bookId: string) => {
      if (!uid) return;
      const bookRef = doc(db, "books", bookId);
      const snap = await getDoc(bookRef);
      if (!snap.exists()) throw new Error("ไม่พบสมุดบัญชีนี้");
      const data = snap.data() as SharedBook;
      if (data.ownerUid !== uid) throw new Error("เฉพาะเจ้าของสมุดเท่านั้นที่ลบสมุดได้");
      await updateDoc(bookRef, { deleted: true, updatedAt: Date.now() });
      if (activeBookId === `shared:${bookId}`) {
        window.localStorage.setItem(activeBookKey(uid), `personal:${uid}`);
        setActiveBookId(`personal:${uid}`);
      }
    },
    [activeBookId, uid]
  );

  return {
    books,
    sharedBooks,
    activeBook,
    loaded,
    selectBook,
    createSharedBook,
    joinSharedBook,
    approveJoinRequest,
    rejectJoinRequest,
    changeMemberRole,
    removeMember,
    leaveBook,
    updateBookName,
    updateBookPassword,
    deleteBook,
    getRememberedBookPassword,
  };
}
