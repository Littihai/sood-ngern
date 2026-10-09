import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  onSnapshot,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "../firebase";
import { ActiveBook, BookMember, BookRole, JoinRequest, SharedBook } from "../types";

type Profile = {
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
};

/** A join request the current user sent to someone else's book. */
export type MyJoinRequest = { bookId: string; status: JoinRequest["status"] };

const activeBookKey = (uid: string) => `sood-ngern-active-book-${uid}`;
const bookListCacheKey = (uid: string) => `sood-ngern-books-${uid}`;
const pendingRequestsKey = (uid: string) => `sood-ngern-join-requests-${uid}`;

const displayNameOf = (profile?: Profile) => profile?.displayName || profile?.email || "Unknown user";

function memberFromProfile(profile: Profile | undefined, role: BookRole): BookMember {
  return {
    name: displayNameOf(profile),
    photoURL: profile?.photoURL || "",
    role,
    joinedAt: Date.now(),
  };
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full / disabled — the cache is only an optimisation
  }
}

/** Strips legacy fields so an old cached/remote doc can never leak a password into state. */
function toSharedBook(id: string, data: Record<string, unknown>): SharedBook {
  const rest = { ...data };
  delete rest.joinPassword;
  return { id, ...rest } as unknown as SharedBook;
}

function readCachedBooks(uid: string | undefined): SharedBook[] {
  if (!uid) return [];
  return readJson<SharedBook[]>(bookListCacheKey(uid), []).map((b) =>
    toSharedBook(b.id, b as unknown as Record<string, unknown>)
  );
}

export function useBooks(uid: string | undefined, profile?: Profile) {
  const personalBook = useMemo<ActiveBook | null>(
    () => (uid ? { kind: "personal", id: uid, name: "Personal book", ownerUid: uid } : null),
    [uid]
  );
  const [sharedBooks, setSharedBooks] = useState<SharedBook[]>(() => readCachedBooks(uid));
  const [loaded, setLoaded] = useState(false);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const [requestStatus, setRequestStatus] = useState<Record<string, JoinRequest["status"]>>({});

  /* ------------------------------- books the user is a member of ------------------------------- */
  useEffect(() => {
    if (!uid) {
      setSharedBooks([]);
      setLoaded(true);
      setActiveBookId(null);
      setPendingIds([]);
      return;
    }
    setActiveBookId(window.localStorage.getItem(activeBookKey(uid)) || `personal:${uid}`);
    setPendingIds(readJson<string[]>(pendingRequestsKey(uid), []));
    setLoaded(false);

    // Members-only query — the security rules reject anything broader.
    const q = query(collection(db, "books"), where("memberIds", "array-contains", uid));
    const unsub = onSnapshot(
      q,
      (snap) => {
        snap.docs.forEach((d) => {
          // One-off migration: the old password flow stored `joinPassword` in plain text.
          if (d.data().ownerUid === uid && "joinPassword" in d.data()) {
            updateDoc(d.ref, { joinPassword: deleteField() }).catch((err) =>
              console.error("could not remove legacy joinPassword", err)
            );
          }
        });
        const books = snap.docs
          .map((d) => toSharedBook(d.id, d.data()))
          .filter((b) => !b.deleted)
          .sort((a, b) => b.updatedAt - a.updatedAt);
        setSharedBooks(books);
        writeJson(bookListCacheKey(uid), books);
        setLoaded(true);
      },
      (err) => {
        console.error("books listener failed", err);
        setLoaded(true);
      }
    );
    return unsub;
  }, [uid]);

  /* ------------------------------- my outgoing join requests ------------------------------- */
  const pendingKey = pendingIds.join(",");
  useEffect(() => {
    if (!uid || pendingIds.length === 0) {
      setRequestStatus({});
      return;
    }
    const unsubs = pendingIds.map((bookId) =>
      onSnapshot(
        doc(db, "books", bookId, "joinRequests", uid),
        (snap) => {
          if (snap.exists()) {
            setRequestStatus((prev) => ({ ...prev, [bookId]: (snap.data() as JoinRequest).status }));
          } else {
            // Approved (request deleted by the owner) or withdrawn — nothing left to track.
            setRequestStatus((prev) => {
              const rest = { ...prev };
              delete rest[bookId];
              return rest;
            });
            setPendingIds((prev) => {
              const next = prev.filter((id) => id !== bookId);
              writeJson(pendingRequestsKey(uid), next);
              return next;
            });
          }
        },
        (err) => console.error("join request listener failed", err)
      )
    );
    return () => unsubs.forEach((u) => u());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [uid, pendingKey]);

  const myRequests = useMemo<MyJoinRequest[]>(
    () =>
      pendingIds
        .filter((bookId) => requestStatus[bookId])
        .map((bookId) => ({ bookId, status: requestStatus[bookId] })),
    [pendingIds, requestStatus]
  );

  const books = useMemo(() => {
    return personalBook ? [personalBook, ...sharedBooks.map((book) => ({ ...book, kind: "shared" as const }))] : [];
  }, [personalBook, sharedBooks]);

  const activeBook = useMemo<ActiveBook | null>(() => {
    if (!personalBook) return null;
    return books.find((book) => `${book.kind}:${book.id}` === activeBookId) || personalBook;
  }, [activeBookId, books, personalBook]);

  const rememberActive = useCallback(
    (key: string) => {
      if (!uid) return;
      window.localStorage.setItem(activeBookKey(uid), key);
      setActiveBookId(key);
    },
    [uid]
  );

  const selectBook = useCallback((book: ActiveBook) => rememberActive(`${book.kind}:${book.id}`), [rememberActive]);

  const findOwnedBook = useCallback(
    (bookId: string, action: string) => {
      const book = sharedBooks.find((b) => b.id === bookId);
      if (!book) throw new Error("ไม่พบสมุดบัญชีนี้");
      if (book.ownerUid !== uid) throw new Error(`เฉพาะเจ้าของสมุดเท่านั้นที่${action}ได้`);
      return book;
    },
    [sharedBooks, uid]
  );

  /* ------------------------------- create / join ------------------------------- */
  const createSharedBook = useCallback(
    async (name: string) => {
      if (!uid) return;
      const cleanName = name.trim();
      if (!cleanName) throw new Error("กรุณากรอกชื่อสมุดบัญชี");
      const owner = memberFromProfile(profile, "owner");
      const now = Date.now();
      const ref = await addDoc(collection(db, "books"), {
        name: cleanName,
        ownerUid: uid,
        ownerName: owner.name,
        memberIds: [uid],
        members: { [uid]: owner },
        createdAt: now,
        updatedAt: now,
      });
      rememberActive(`shared:${ref.id}`);
    },
    [uid, profile, rememberActive]
  );

  /** Sends a join request; the book's owner must approve it. */
  const requestJoin = useCallback(
    async (bookId: string) => {
      if (!uid) return;
      const cleanId = bookId.trim();
      if (!cleanId) throw new Error("กรุณากรอก ID ของสมุดบัญชี");
      if (sharedBooks.some((b) => b.id === cleanId)) {
        rememberActive(`shared:${cleanId}`);
        return;
      }
      try {
        await setDoc(doc(db, "books", cleanId, "joinRequests", uid), {
          requesterUid: uid,
          requesterName: displayNameOf(profile),
          requesterPhotoURL: profile?.photoURL || "",
          requestedAt: Date.now(),
          role: "viewer" as BookRole,
          status: "pending",
        });
      } catch (err) {
        if (err instanceof Error && err.message.includes("permission")) {
          throw new Error("ไม่พบสมุดบัญชีนี้ หรือคุณเป็นสมาชิกอยู่แล้ว");
        }
        throw err;
      }
      setPendingIds((prev) => {
        const next = prev.includes(cleanId) ? prev : [...prev, cleanId];
        writeJson(pendingRequestsKey(uid), next);
        return next;
      });
    },
    [uid, profile, sharedBooks, rememberActive]
  );

  const cancelRequest = useCallback(
    async (bookId: string) => {
      if (!uid) return;
      await deleteDoc(doc(db, "books", bookId, "joinRequests", uid));
    },
    [uid]
  );

  /* ------------------------------- owner / member management ------------------------------- */
  const changeMemberRole = useCallback(
    async (bookId: string, targetUid: string, role: BookRole) => {
      findOwnedBook(bookId, "เปลี่ยนสิทธิ์สมาชิก");
      if (targetUid === uid) throw new Error("ไม่สามารถเปลี่ยนสิทธิ์ของตัวเองได้");
      await updateDoc(doc(db, "books", bookId), {
        [`members.${targetUid}.role`]: role,
        updatedAt: Date.now(),
      });
    },
    [uid, findOwnedBook]
  );

  const removeMember = useCallback(
    async (bookId: string, targetUid: string) => {
      findOwnedBook(bookId, "ลบสมาชิก");
      if (targetUid === uid) throw new Error("ไม่สามารถลบตัวเองจากสมุดได้ กรุณาใช้ออกจากสมุดบัญชี");
      await updateDoc(doc(db, "books", bookId), {
        memberIds: arrayRemove(targetUid),
        [`members.${targetUid}`]: deleteField(),
        updatedAt: Date.now(),
      });
    },
    [uid, findOwnedBook]
  );

  const leaveBook = useCallback(
    async (bookId: string) => {
      if (!uid) return;
      const book = sharedBooks.find((b) => b.id === bookId);
      if (book?.ownerUid === uid) throw new Error("เจ้าของสมุดไม่สามารถออกจากสมุดได้ ต้องลบสมุดแทน");
      rememberActive(`personal:${uid}`);
      await updateDoc(doc(db, "books", bookId), {
        memberIds: arrayRemove(uid),
        [`members.${uid}`]: deleteField(),
        updatedAt: Date.now(),
      });
    },
    [uid, sharedBooks, rememberActive]
  );

  const updateBookName = useCallback(
    async (bookId: string, name: string) => {
      findOwnedBook(bookId, "เปลี่ยนชื่อ");
      const cleanName = name.trim();
      if (!cleanName) throw new Error("กรุณากรอกชื่อสมุดบัญชี");
      await updateDoc(doc(db, "books", bookId), { name: cleanName, updatedAt: Date.now() });
    },
    [findOwnedBook]
  );

  /** Soft delete: the book disappears for every member; transactions are kept (and locked). */
  const deleteBook = useCallback(
    async (bookId: string) => {
      if (!uid) return;
      findOwnedBook(bookId, "ลบสมุด");
      if (activeBookId === `shared:${bookId}`) rememberActive(`personal:${uid}`);
      await updateDoc(doc(db, "books", bookId), { deleted: true, updatedAt: Date.now() });
    },
    [uid, activeBookId, findOwnedBook, rememberActive]
  );

  return {
    books,
    activeBook,
    loaded,
    selectBook,
    createSharedBook,
    requestJoin,
    cancelRequest,
    myRequests,
    changeMemberRole,
    removeMember,
    leaveBook,
    updateBookName,
    deleteBook,
  };
}

/** Incoming join requests for a book the current user owns. */
export function useJoinRequests(bookId: string | null) {
  const [requests, setRequests] = useState<JoinRequest[]>([]);

  useEffect(() => {
    if (!bookId) {
      setRequests([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "books", bookId, "joinRequests"),
      (snap) => {
        setRequests(
          snap.docs
            .map((d) => ({ id: d.id, bookId, ...d.data() } as JoinRequest))
            .sort((a, b) => a.requestedAt - b.requestedAt)
        );
      },
      (err) => console.error("join requests listener failed", err)
    );
    return unsub;
  }, [bookId]);

  /** Adds the requester to the book and clears the request in one atomic write. */
  const approve = useCallback(
    async (request: JoinRequest, role: BookRole) => {
      const batch = writeBatch(db);
      batch.update(doc(db, "books", request.bookId), {
        memberIds: arrayUnion(request.requesterUid),
        [`members.${request.requesterUid}`]: {
          name: request.requesterName,
          photoURL: request.requesterPhotoURL,
          role,
          joinedAt: Date.now(),
        } satisfies BookMember,
        updatedAt: Date.now(),
      });
      batch.delete(doc(db, "books", request.bookId, "joinRequests", request.id));
      await batch.commit();
    },
    []
  );

  const reject = useCallback(async (request: JoinRequest) => {
    await updateDoc(doc(db, "books", request.bookId, "joinRequests", request.id), { status: "rejected" });
  }, []);

  const clear = useCallback(async (request: JoinRequest) => {
    await deleteDoc(doc(db, "books", request.bookId, "joinRequests", request.id));
  }, []);

  return { requests, approve, reject, clear };
}
