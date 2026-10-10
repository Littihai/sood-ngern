/**
 * Security-rules tests. They run against the Firestore emulator:
 *   npm run test:rules        (needs JDK 21+, see README)
 */
import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";

const OWNER = "alice";
const EDITOR = "carol";
const VIEWER = "dave";
const STRANGER = "bob";
const BOOK = "book1";

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: "demo-sood-ngern",
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
  });
});
afterAll(async () => env.cleanup());

const now = () => Date.now();
const member = (name: string, role: string) => ({ name, photoURL: "", role, joinedAt: now() });
const tx = (uid: string, over: Record<string, unknown> = {}) => ({
  type: "expense",
  amount: 100,
  category: "food",
  note: "",
  date: "2026-10-01",
  createdAt: now(),
  createdByUid: uid,
  createdByName: uid,
  createdByPhotoURL: "",
  ...over,
});
const bookDoc = (over: Record<string, unknown> = {}) => ({
  name: "สมุดครอบครัว",
  ownerUid: OWNER,
  ownerName: "Alice",
  memberIds: [OWNER, EDITOR, VIEWER],
  members: { [OWNER]: member("Alice", "owner"), [EDITOR]: member("Carol", "editor"), [VIEWER]: member("Dave", "viewer") },
  createdAt: now(),
  updatedAt: now(),
  ...over,
});
const joinReq = (uid: string, over: Record<string, unknown> = {}) => ({
  requesterUid: uid,
  requesterName: uid,
  requesterPhotoURL: "",
  requestedAt: now(),
  role: "viewer",
  status: "pending",
  ...over,
});

async function seed(fn: (db: ReturnType<ReturnType<RulesTestEnvironment["authenticatedContext"]>["firestore"]>) => Promise<void>) {
  await env.withSecurityRulesDisabled(async (ctx) => fn(ctx.firestore() as never));
}
const as = (uid: string) => env.authenticatedContext(uid).firestore();

beforeEach(async () => {
  await env.clearFirestore();
  await seed(async (db) => {
    await setDoc(doc(db, "books", BOOK), bookDoc());
    await setDoc(doc(db, "books", BOOK, "transactions", "t1"), tx(EDITOR));
  });
});

describe("personal transactions", () => {
  it("owner can write and read their own", async () => {
    await assertSucceeds(setDoc(doc(as(OWNER), "users", OWNER, "transactions", "a"), tx(OWNER)));
    await assertSucceeds(getDoc(doc(as(OWNER), "users", OWNER, "transactions", "a")));
  });
  it("other users and anonymous visitors cannot read or write", async () => {
    await seed(async (db) => void (await setDoc(doc(db, "users", OWNER, "transactions", "a"), tx(OWNER))));
    await assertFails(getDoc(doc(as(STRANGER), "users", OWNER, "transactions", "a")));
    await assertFails(setDoc(doc(as(STRANGER), "users", OWNER, "transactions", "b"), tx(STRANGER)));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), "users", OWNER, "transactions", "a")));
  });
  it("rejects invalid data (negative amount, spoofed creator)", async () => {
    await assertFails(setDoc(doc(as(OWNER), "users", OWNER, "transactions", "x"), tx(OWNER, { amount: -5 })));
    await assertFails(setDoc(doc(as(OWNER), "users", OWNER, "transactions", "y"), tx(STRANGER)));
  });
});

describe("books: reading", () => {
  it("members can read; strangers cannot (the old password leak)", async () => {
    await assertSucceeds(getDoc(doc(as(VIEWER), "books", BOOK)));
    await assertFails(getDoc(doc(as(STRANGER), "books", BOOK)));
  });
  it("listing is members-only: a stranger sees nothing and cannot list everything", async () => {
    const mine = await assertSucceeds(getDocs(query(collection(as(STRANGER), "books"), where("memberIds", "array-contains", STRANGER))));
    if (mine.size !== 0) throw new Error("stranger should not see any book");
    await assertFails(getDocs(collection(as(STRANGER), "books")));
    await assertFails(getDocs(query(collection(as(STRANGER), "books"), where("memberIds", "array-contains", OWNER))));
  });
});

describe("books: creating", () => {
  it("accepts a valid book", async () => {
    await assertSucceeds(
      setDoc(doc(as(STRANGER), "books", "new"), bookDoc({ ownerUid: STRANGER, memberIds: [STRANGER], members: { [STRANGER]: member("Bob", "owner") } }))
    );
  });
  it("rejects a legacy joinPassword field and a spoofed owner", async () => {
    const mine = { ownerUid: STRANGER, memberIds: [STRANGER], members: { [STRANGER]: member("Bob", "owner") } };
    await assertFails(setDoc(doc(as(STRANGER), "books", "n1"), bookDoc({ ...mine, joinPassword: "1234" })));
    await assertFails(setDoc(doc(as(STRANGER), "books", "n2"), bookDoc({ ...mine, ownerUid: OWNER })));
  });
});

describe("books: transactions", () => {
  it("owner and editor can write, viewer and stranger cannot", async () => {
    await assertSucceeds(setDoc(doc(as(OWNER), "books", BOOK, "transactions", "o"), tx(OWNER)));
    await assertSucceeds(setDoc(doc(as(EDITOR), "books", BOOK, "transactions", "e"), tx(EDITOR)));
    await assertFails(setDoc(doc(as(VIEWER), "books", BOOK, "transactions", "v"), tx(VIEWER)));
    await assertFails(setDoc(doc(as(STRANGER), "books", BOOK, "transactions", "s"), tx(STRANGER)));
  });
  it("all members can read, strangers cannot", async () => {
    await assertSucceeds(getDoc(doc(as(VIEWER), "books", BOOK, "transactions", "t1")));
    await assertFails(getDoc(doc(as(STRANGER), "books", BOOK, "transactions", "t1")));
  });
  it("an editor can anonymise their own entries (account deletion)", async () => {
    await assertSucceeds(updateDoc(doc(as(EDITOR), "books", BOOK, "transactions", "t1"), { createdByName: "ผู้ใช้ที่ลบบัญชี", createdByPhotoURL: "" }));
  });
  it("creator identity cannot be changed", async () => {
    await assertFails(updateDoc(doc(as(EDITOR), "books", BOOK, "transactions", "t1"), { createdByUid: OWNER }));
  });

  describe("anonymising your own entries when you delete your account", () => {
    const GONE = "ผู้ใช้ที่ลบบัญชี";
    beforeEach(async () => {
      // dave is a VIEWER now but used to be an editor: his old entry still carries his identity
      await seed(async (db) => void (await setDoc(doc(db, "books", BOOK, "transactions", "old-dave"), tx(VIEWER))));
    });
    it("works for any current role (a former editor demoted to viewer)", async () => {
      await assertSucceeds(updateDoc(doc(as(VIEWER), "books", BOOK, "transactions", "old-dave"), { createdByName: GONE, createdByPhotoURL: "" }));
    });
    it("only accepts the exact anonymised values and only those two fields", async () => {
      const ref = () => doc(as(VIEWER), "books", BOOK, "transactions", "old-dave");
      await assertFails(updateDoc(ref(), { createdByName: "Someone else", createdByPhotoURL: "" }));
      await assertFails(updateDoc(ref(), { createdByName: GONE, createdByPhotoURL: "https://x.example/a.jpg" }));
      await assertFails(updateDoc(ref(), { createdByName: GONE, createdByPhotoURL: "", amount: 1 }));
      await assertFails(updateDoc(ref(), { amount: 1 }));
    });
    it("cannot be used on someone else's entry, or by a non-member", async () => {
      await assertFails(updateDoc(doc(as(VIEWER), "books", BOOK, "transactions", "t1"), { createdByName: GONE, createdByPhotoURL: "" }));
      await assertFails(updateDoc(doc(as(STRANGER), "books", BOOK, "transactions", "old-dave"), { createdByName: GONE, createdByPhotoURL: "" }));
    });
  });
});

describe("transaction date validation", () => {
  const path = ["users", OWNER, "transactions"] as const;
  it("accepts real dates and refuses impossible ones", async () => {
    await assertSucceeds(setDoc(doc(as(OWNER), ...path, "ok1"), tx(OWNER, { date: "2026-10-31" })));
    await assertSucceeds(setDoc(doc(as(OWNER), ...path, "ok2"), tx(OWNER, { date: "2028-02-29" })));
    await assertFails(setDoc(doc(as(OWNER), ...path, "bad1"), tx(OWNER, { date: "2026-13-45" })));
    await assertFails(setDoc(doc(as(OWNER), ...path, "bad2"), tx(OWNER, { date: "2026-00-10" })));
    await assertFails(setDoc(doc(as(OWNER), ...path, "bad3"), tx(OWNER, { date: "2026-10-32" })));
    await assertFails(setDoc(doc(as(OWNER), ...path, "bad4"), tx(OWNER, { date: "" })));
  });
});

describe("joinRequestRefs (my outgoing requests, stored per user)", () => {
  const ref = (uid: string, bookId = BOOK) => ["users", uid, "joinRequestRefs", bookId] as const;
  it("the owner can create, read and delete their own", async () => {
    await assertSucceeds(setDoc(doc(as(STRANGER), ...ref(STRANGER)), { requestedAt: now() }));
    await assertSucceeds(getDoc(doc(as(STRANGER), ...ref(STRANGER))));
    await assertSucceeds(setDoc(doc(as(STRANGER), ...ref(STRANGER)), { requestedAt: now() })); // re-request overwrites
    await assertSucceeds(deleteDoc(doc(as(STRANGER), ...ref(STRANGER))));
  });
  it("nobody else can touch them, not even the book owner", async () => {
    await seed(async (db) => void (await setDoc(doc(db, ...ref(STRANGER)), { requestedAt: now() })));
    await assertFails(getDoc(doc(as(OWNER), ...ref(STRANGER))));
    await assertFails(setDoc(doc(as(OWNER), ...ref(STRANGER, "x")), { requestedAt: now() }));
    await assertFails(deleteDoc(doc(as(OWNER), ...ref(STRANGER))));
    await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(), ...ref(STRANGER))));
  });
  it("only a valid requestedAt is stored (no extra fields)", async () => {
    await assertFails(setDoc(doc(as(STRANGER), ...ref(STRANGER)), { requestedAt: now(), note: "x" }));
    await assertFails(setDoc(doc(as(STRANGER), ...ref(STRANGER)), { requestedAt: "yesterday" }));
  });
});

describe("join requests", () => {
  const reqPath = (uid: string) => ["books", BOOK, "joinRequests", uid] as const;

  it("a stranger can request for themself only, as a pending viewer", async () => {
    await assertSucceeds(setDoc(doc(as(STRANGER), ...reqPath(STRANGER)), joinReq(STRANGER)));
    await assertFails(setDoc(doc(as(STRANGER), ...reqPath("someone-else")), joinReq("someone-else")));
    await assertFails(setDoc(doc(as(STRANGER), ...reqPath(STRANGER)), joinReq(STRANGER, { role: "editor" })));
    await assertFails(setDoc(doc(as(STRANGER), ...reqPath(STRANGER)), joinReq(STRANGER, { status: "approved" })));
  });
  it("an existing member cannot file a request", async () => {
    await assertFails(setDoc(doc(as(VIEWER), ...reqPath(VIEWER)), joinReq(VIEWER)));
  });
  it("requesting an unknown book fails", async () => {
    await assertFails(setDoc(doc(as(STRANGER), "books", "nope", "joinRequests", STRANGER), joinReq(STRANGER)));
  });
  it("only the owner and the requester can read it", async () => {
    await seed(async (db) => void (await setDoc(doc(db, ...reqPath(STRANGER)), joinReq(STRANGER))));
    await assertSucceeds(getDoc(doc(as(OWNER), ...reqPath(STRANGER))));
    await assertSucceeds(getDoc(doc(as(STRANGER), ...reqPath(STRANGER))));
    await assertFails(getDoc(doc(as(EDITOR), ...reqPath(STRANGER))));
  });
  it("a stranger cannot add themself to a book directly (no password bypass)", async () => {
    await assertFails(
      updateDoc(doc(as(STRANGER), "books", BOOK), {
        memberIds: arrayUnion(STRANGER),
        [`members.${STRANGER}`]: member("Bob", "viewer"),
        updatedAt: now(),
      })
    );
  });
  it("owner approves: adds the member and deletes the request atomically", async () => {
    await seed(async (db) => void (await setDoc(doc(db, ...reqPath(STRANGER)), joinReq(STRANGER))));
    const db = as(OWNER);
    const batch = writeBatch(db);
    batch.update(doc(db, "books", BOOK), {
      memberIds: arrayUnion(STRANGER),
      [`members.${STRANGER}`]: member("Bob", "viewer"),
      updatedAt: now(),
    });
    batch.delete(doc(db, ...reqPath(STRANGER)));
    await assertSucceeds(batch.commit());
    await assertSucceeds(getDoc(doc(as(STRANGER), "books", BOOK)));
  });
  it("owner can reject; others cannot change the status", async () => {
    await seed(async (db) => void (await setDoc(doc(db, ...reqPath(STRANGER)), joinReq(STRANGER))));
    await assertFails(updateDoc(doc(as(EDITOR), ...reqPath(STRANGER)), { status: "rejected" }));
    await assertFails(updateDoc(doc(as(STRANGER), ...reqPath(STRANGER)), { status: "approved" }));
    await assertSucceeds(updateDoc(doc(as(OWNER), ...reqPath(STRANGER)), { status: "rejected" }));
  });
  it("the requester can withdraw their request", async () => {
    await seed(async (db) => void (await setDoc(doc(db, ...reqPath(STRANGER)), joinReq(STRANGER))));
    await assertSucceeds(deleteDoc(doc(as(STRANGER), ...reqPath(STRANGER))));
  });
  it("after a rejection the requester can clear it and ask again, but cannot overwrite it in place", async () => {
    await seed(async (db) => void (await setDoc(doc(db, ...reqPath(STRANGER)), joinReq(STRANGER, { status: "rejected" }))));
    await assertFails(setDoc(doc(as(STRANGER), ...reqPath(STRANGER)), joinReq(STRANGER)));
    await assertSucceeds(deleteDoc(doc(as(STRANGER), ...reqPath(STRANGER))));
    await assertSucceeds(setDoc(doc(as(STRANGER), ...reqPath(STRANGER)), joinReq(STRANGER)));
  });
});

describe("books: membership changes", () => {
  it("a member can leave", async () => {
    await assertSucceeds(
      updateDoc(doc(as(VIEWER), "books", BOOK), { memberIds: arrayRemove(VIEWER), [`members.${VIEWER}`]: deleteField(), updatedAt: now() })
    );
  });
  it("a member cannot remove someone else or promote themself", async () => {
    await assertFails(
      updateDoc(doc(as(VIEWER), "books", BOOK), { memberIds: arrayRemove(EDITOR), [`members.${EDITOR}`]: deleteField(), updatedAt: now() })
    );
    await assertFails(updateDoc(doc(as(VIEWER), "books", BOOK), { [`members.${VIEWER}.role`]: "editor", updatedAt: now() }));
  });
  it("the owner can change roles and remove members, but not leave or hand over ownership", async () => {
    await assertSucceeds(updateDoc(doc(as(OWNER), "books", BOOK), { [`members.${VIEWER}.role`]: "editor", updatedAt: now() }));
    await assertSucceeds(
      updateDoc(doc(as(OWNER), "books", BOOK), { memberIds: arrayRemove(VIEWER), [`members.${VIEWER}`]: deleteField(), updatedAt: now() })
    );
    await assertFails(updateDoc(doc(as(OWNER), "books", BOOK), { ownerUid: STRANGER }));
    await assertFails(
      updateDoc(doc(as(OWNER), "books", BOOK), { memberIds: arrayRemove(OWNER), [`members.${OWNER}`]: deleteField() })
    );
  });
  it("memberIds must stay in sync with members", async () => {
    await assertFails(updateDoc(doc(as(OWNER), "books", BOOK), { memberIds: arrayUnion(STRANGER), updatedAt: now() }));
  });
});

describe("books: soft delete, purge and legacy data", () => {
  it("only the owner can soft-delete; afterwards editors can no longer write", async () => {
    await assertFails(updateDoc(doc(as(EDITOR), "books", BOOK), { deleted: true, updatedAt: now() }));
    await assertSucceeds(updateDoc(doc(as(OWNER), "books", BOOK), { deleted: true, updatedAt: now() }));
    await assertFails(setDoc(doc(as(EDITOR), "books", BOOK, "transactions", "late"), tx(EDITOR)));
  });
  it("the owner can purge transactions and hard-delete the book (account deletion)", async () => {
    await assertSucceeds(updateDoc(doc(as(OWNER), "books", BOOK), { deleted: true, updatedAt: now() }));
    await assertSucceeds(deleteDoc(doc(as(OWNER), "books", BOOK, "transactions", "t1")));
    await assertSucceeds(deleteDoc(doc(as(OWNER), "books", BOOK)));
  });
  it("non-owners cannot delete the book or purge its transactions", async () => {
    await assertFails(deleteDoc(doc(as(EDITOR), "books", BOOK)));
    await assertFails(deleteDoc(doc(as(STRANGER), "books", BOOK, "transactions", "t1")));
    await assertSucceeds(deleteDoc(doc(as(EDITOR), "books", BOOK, "transactions", "t1"))); // editors may still delete entries
  });
  it("a legacy joinPassword can be removed by the owner but never written", async () => {
    await seed(async (db) => void (await setDoc(doc(db, "books", "old"), bookDoc({ joinPassword: "secret" }))));
    await assertFails(updateDoc(doc(as(OWNER), "books", "old"), { name: "x", updatedAt: now() }));
    await assertSucceeds(updateDoc(doc(as(OWNER), "books", "old"), { joinPassword: deleteField() }));
    await assertFails(updateDoc(doc(as(OWNER), "books", BOOK), { joinPassword: "1234" }));
  });
});
