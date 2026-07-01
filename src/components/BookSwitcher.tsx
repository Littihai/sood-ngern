import { useState } from "react";
import { BookOpen, Lock, Plus, Users } from "lucide-react";
import { ActiveBook } from "../types";
import { T } from "../theme";
import { inputStyle, primaryBtn } from "./shared";

export function BookSwitcher({
  books,
  activeBook,
  currentUid,
  onSelect,
  onCreate,
  onJoin,
  getRememberedPassword,
}: {
  books: ActiveBook[];
  activeBook: ActiveBook | null;
  currentUid?: string;
  onSelect: (book: ActiveBook) => void;
  onCreate: (name: string, password: string, rememberPassword: boolean) => Promise<void>;
  onJoin: (bookId: string, password: string, rememberPassword: boolean) => Promise<void>;
  getRememberedPassword?: (bookId: string) => string;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [name, setName] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [bookId, setBookId] = useState("");
  const [joinPassword, setJoinPassword] = useState("");
  const [accessPassword, setAccessPassword] = useState("");
  const [rememberPassword, setRememberPassword] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [accessBook, setAccessBook] = useState<ActiveBook | null>(null);

  const createValidationMessage = !name.trim()
    ? "กรุณากรอกชื่อสมุดบัญชี"
    : createPassword.trim().length < 4
      ? "รหัสผ่านต้องมีอย่างน้อย 4 ตัวอักษร"
      : "";

  const joinValidationMessage = !bookId.trim()
    ? "กรุณากรอก ID ของสมุดบัญชี"
    : !joinPassword.trim()
      ? "กรุณากรอกรหัสผ่านก่อนเข้าร่วม"
      : "";

  const accessValidationMessage = !accessPassword.trim() ? "กรุณากรอกรหัสผ่านก่อนเปิดสมุดบัญชี" : "";

  const run = async (task: () => Promise<void>) => {
    setBusy(true);
    setError("");
    try {
      await task();
      setName("");
      setCreatePassword("");
      setBookId("");
      setJoinPassword("");
      setAccessPassword("");
      setCreateOpen(false);
      setJoinOpen(false);
      setAccessBook(null);
      setRememberPassword(true);
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("permission-denied") || message.includes("Missing or insufficient permissions")
          ? "ไม่สามารถเข้าถึงสมุดบัญชีนี้ได้ กรุณาตรวจสอบรหัสผ่านหรือขอเจ้าของสมุดช่วยเปิดให้"
          : message || "ไม่สามารถเปิดสมุดบัญชีนี้ได้ กรุณาตรวจสอบรหัสผ่านหรือ ID ของสมุด"
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ border: `1px solid ${T.paperLine}`, borderRadius: 12, padding: 12, marginBottom: 18, background: T.paper }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.inkSoft, fontSize: 12, fontWeight: 600 }}>
          <BookOpen size={15} />
          Book
        </div>
        <select
          value={activeBook ? `${activeBook.kind}:${activeBook.id}` : ""}
          onChange={(event) => {
            const selected = books.find((book) => `${book.kind}:${book.id}` === event.target.value);
            if (!selected) return;
            if (selected.kind === "personal") {
              onSelect(selected);
              return;
            }
            const isMember = Boolean(currentUid && selected.memberIds.includes(currentUid));
            if (isMember) {
              onSelect(selected);
              return;
            }
            const remembered = getRememberedPassword?.(selected.id) || "";
            setAccessBook(selected);
            setAccessPassword(remembered);
            setCreateOpen(false);
            setJoinOpen(false);
            setError("");
          }}
          style={{ ...inputStyle, marginTop: 0, width: "auto", minWidth: 220, flex: "1 1 220px" }}
        >
          {books.map((book) => (
            <option key={`${book.kind}:${book.id}`} value={`${book.kind}:${book.id}`}>
              {book.kind === "personal"
                ? "Personal book"
                : `${book.name}${book.kind === "shared" && currentUid && !book.memberIds.includes(currentUid) ? " • password required" : ""}`}
            </option>
          ))}
        </select>
        <button
          onClick={() => {
            setCreateOpen((v) => !v);
            setJoinOpen(false);
            setError("");
          }}
          style={{ ...primaryBtn, padding: "9px 12px" }}
        >
          <Plus size={14} />
          Create
        </button>
        <button
          onClick={() => {
            setJoinOpen((v) => !v);
            setCreateOpen(false);
            setError("");
          }}
          style={{ ...primaryBtn, padding: "9px 12px", background: T.gold }}
        >
          <Lock size={14} />
          Join
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 12, color: T.inkSoft }}>
        เลือกสมุดบัญชีที่คุณสร้างไว้หรือเข้าร่วมไว้เพื่อสลับไปใช้ได้ทันที
      </div>

      {accessBook && (
        <div style={{ display: "grid", gridTemplateColumns: "minmax(0, 1fr) auto auto", gap: 10, alignItems: "end", marginTop: 12 }}>
          <Field label="รหัสผ่านสมุดบัญชี">
            <input value={accessPassword} onChange={(e) => setAccessPassword(e.target.value)} type="password" placeholder="ใส่รหัสผ่านเพื่อเปิดสมุด" style={inputStyle} />
          </Field>
          <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: T.inkSoft }}>
            <input type="checkbox" checked={rememberPassword} onChange={(e) => setRememberPassword(e.target.checked)} />
            จำรหัสผ่านไว้
          </label>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { setAccessBook(null); setAccessPassword(""); setError(""); }} style={{ ...primaryBtn, justifyContent: "center", background: T.paperLine, color: T.ink }}>
              ยกเลิก
            </button>
            <button
              disabled={busy || !!accessValidationMessage}
              onClick={() => {
                if (accessValidationMessage) {
                  setError(accessValidationMessage);
                  return;
                }
                run(() => onJoin(accessBook.id, accessPassword, rememberPassword));
              }}
              style={{ ...primaryBtn, justifyContent: "center", opacity: busy || !!accessValidationMessage ? 0.55 : 1 }}
            >
              เปิดสมุดบัญชี
            </button>
          </div>
        </div>
      )}

      {activeBook?.kind === "shared" && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, color: T.inkSoft, fontSize: 12 }}>
          <Users size={14} />
          <span>{activeBook.memberIds.length} members</span>
          <span className="mono" style={{ marginLeft: "auto" }}>ID: {activeBook.id}</span>
        </div>
      )}

      {(createOpen || joinOpen) && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr)) auto", gap: 10, alignItems: "end", marginTop: 12 }}>
          {createOpen ? (
            <>
              <Field label="ชื่อสมุดบัญชี">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น สมุดครอบครัว" style={inputStyle} />
              </Field>
              <Field label="รหัสผ่าน">
                <input value={createPassword} onChange={(e) => setCreatePassword(e.target.value)} type="password" placeholder="อย่างน้อย 4 ตัวอักษร" style={inputStyle} />
              </Field>
              <div />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: T.inkSoft }}>
                <input type="checkbox" checked={rememberPassword} onChange={(e) => setRememberPassword(e.target.checked)} />
                จำรหัสผ่านไว้
              </label>
              {createValidationMessage && <div style={{ color: T.expense, fontSize: 12 }}>{createValidationMessage}</div>}
              <button
                disabled={busy || !!createValidationMessage}
                onClick={() => {
                  if (createValidationMessage) {
                    setError(createValidationMessage);
                    return;
                  }
                  run(() => onCreate(name, createPassword, rememberPassword));
                }}
                style={{ ...primaryBtn, justifyContent: "center", opacity: busy || !!createValidationMessage ? 0.55 : 1 }}
              >
                สร้างสมุดบัญชี
              </button>
            </>
          ) : (
            <>
              <Field label="ID สมุดบัญชี">
                <input value={bookId} onChange={(e) => setBookId(e.target.value)} placeholder="วาง ID ของสมุดที่ต้องการเข้าร่วม" style={inputStyle} />
              </Field>
              <Field label="รหัสผ่าน">
                <input value={joinPassword} onChange={(e) => setJoinPassword(e.target.value)} type="password" placeholder="รหัสผ่านของสมุดบัญชี" style={inputStyle} />
              </Field>
              <div />
              <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 600, color: T.inkSoft }}>
                <input type="checkbox" checked={rememberPassword} onChange={(e) => setRememberPassword(e.target.checked)} />
                จำรหัสผ่านไว้
              </label>
              {joinValidationMessage && <div style={{ color: T.expense, fontSize: 12 }}>{joinValidationMessage}</div>}
              <button
                disabled={busy || !!joinValidationMessage}
                onClick={() => {
                  if (joinValidationMessage) {
                    setError(joinValidationMessage);
                    return;
                  }
                  run(() => onJoin(bookId, joinPassword, rememberPassword));
                }}
                style={{ ...primaryBtn, justifyContent: "center", background: T.gold, opacity: busy || !!joinValidationMessage ? 0.55 : 1 }}
              >
                เข้าร่วมสมุดบัญชี
              </button>
            </>
          )}
        </div>
      )}

      {error && <div style={{ color: T.expense, fontSize: 12, marginTop: 10 }}>{error}</div>}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.inkSoft }}>
      {label}
      {children}
    </label>
  );
}
