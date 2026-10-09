import { useEffect, useState } from "react";
import { BookOpen, Clock, Plus, UserPlus, X } from "lucide-react";
import { ActiveBook, BookRole } from "../types";
import { MyJoinRequest } from "../hooks/useBooks";
import { useAction } from "../hooks/useAction";
import { T } from "../theme";
import { Field, inputStyle, primaryBtn } from "./shared";
import { BookMembers } from "./BookMembers";

type Panel = "create" | "join" | null;

export function BookSwitcher({
  books,
  activeBook,
  currentUid,
  myRequests,
  onSelect,
  onCreate,
  onRequestJoin,
  onCancelRequest,
  onChangeMemberRole,
  onRemoveMember,
  onLeaveBook,
  onUpdateBookName,
  onDeleteBook,
}: {
  books: ActiveBook[];
  activeBook: ActiveBook | null;
  currentUid?: string;
  myRequests: MyJoinRequest[];
  onSelect: (book: ActiveBook) => void;
  onCreate: (name: string) => Promise<void>;
  onRequestJoin: (bookId: string) => Promise<void>;
  onCancelRequest: (bookId: string) => Promise<void>;
  onChangeMemberRole: (bookId: string, targetUid: string, role: BookRole) => Promise<void>;
  onRemoveMember: (bookId: string, targetUid: string) => Promise<void>;
  onLeaveBook: (bookId: string) => Promise<void>;
  onUpdateBookName: (bookId: string, name: string) => Promise<void>;
  onDeleteBook: (bookId: string) => Promise<void>;
}) {
  const [panel, setPanel] = useState<Panel>(null);
  const [name, setName] = useState("");
  const [bookId, setBookId] = useState("");
  const { busy, error, notice, run, reset } = useAction();

  // A message about one book should not follow the user into another.
  const activeKey = activeBook ? `${activeBook.kind}:${activeBook.id}` : "";
  useEffect(() => reset(), [activeKey, reset]);

  const toggle = (next: Exclude<Panel, null>) => {
    setPanel((cur) => (cur === next ? null : next));
    reset();
  };

  const submitCreate = async () => {
    if (await run(() => onCreate(name), "สร้างสมุดบัญชีแล้ว")) {
      setName("");
      setPanel(null);
    }
  };

  const submitJoin = async () => {
    if (await run(() => onRequestJoin(bookId), "ส่งคำขอแล้ว รอเจ้าของสมุดอนุมัติ")) {
      setBookId("");
      setPanel(null);
    }
  };

  const createError = name.trim() ? "" : "กรุณากรอกชื่อสมุดบัญชี";
  const joinError = bookId.trim() ? "" : "กรุณากรอก ID ของสมุดบัญชี";

  return (
    <section className="sn-card" aria-label="สมุดบัญชี" style={{ padding: "18px 20px" }}>
      <h2 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>สมุดบัญชี</h2>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: T.inkSoft, fontSize: 13, fontWeight: 600 }}>
          <BookOpen size={15} />
          สมุด
        </div>
        <select
          aria-label="เลือกสมุดบัญชี"
          value={activeBook ? `${activeBook.kind}:${activeBook.id}` : ""}
          onChange={(event) => {
            const selected = books.find((book) => `${book.kind}:${book.id}` === event.target.value);
            if (selected) onSelect(selected);
          }}
          style={{ ...inputStyle, marginTop: 0, width: "auto", minWidth: 220, flex: "1 1 220px" }}
        >
          {books.map((book) => (
            <option key={`${book.kind}:${book.id}`} value={`${book.kind}:${book.id}`}>
              {book.kind === "personal" ? "สมุดส่วนตัว" : book.name}
            </option>
          ))}
        </select>
        <button onClick={() => toggle("create")} style={{ ...primaryBtn, padding: "9px 12px" }}>
          <Plus size={14} />
          สร้าง
        </button>
        <button onClick={() => toggle("join")} style={{ ...primaryBtn, padding: "9px 12px", background: T.gold }}>
          <UserPlus size={14} />
          เข้าร่วม
        </button>
      </div>

      <div style={{ marginTop: 10, fontSize: 13, color: T.inkSoft }}>
        เลือกสมุดบัญชีที่คุณสร้างไว้หรือเข้าร่วมไว้เพื่อสลับไปใช้ได้ทันที
      </div>

      {panel && (
        <div style={{ display: "flex", gap: 10, alignItems: "end", flexWrap: "wrap", marginTop: 12 }}>
          {panel === "create" ? (
            <>
              <Field label="ชื่อสมุดบัญชี">
                <input value={name} onChange={(e) => setName(e.target.value)} placeholder="เช่น สมุดครอบครัว" maxLength={80} style={inputStyle} />
              </Field>
              <button
                disabled={busy || !!createError}
                onClick={submitCreate}
                style={{ ...primaryBtn, justifyContent: "center", opacity: busy || createError ? 0.55 : 1 }}
              >
                สร้างสมุดบัญชี
              </button>
            </>
          ) : (
            <>
              <Field label="ID สมุดบัญชี">
                <input value={bookId} onChange={(e) => setBookId(e.target.value)} placeholder="วาง ID ที่เจ้าของสมุดส่งให้" style={inputStyle} />
              </Field>
              <button
                disabled={busy || !!joinError}
                onClick={submitJoin}
                style={{ ...primaryBtn, justifyContent: "center", background: T.gold, opacity: busy || joinError ? 0.55 : 1 }}
              >
                ขอเข้าร่วมสมุด
              </button>
              <div style={{ flexBasis: "100%", fontSize: 13, color: T.inkSoft }}>
                เจ้าของสมุดจะได้รับคำขอและต้องอนุมัติก่อน คุณจึงจะเห็นข้อมูลในสมุด
              </div>
            </>
          )}
        </div>
      )}

      {myRequests.length > 0 && (
        <div style={{ marginTop: 12, display: "grid", gap: 6 }}>
          {myRequests.map((req) => (
            <div
              key={req.bookId}
              style={{ display: "flex", alignItems: "center", gap: 8, border: `1px solid ${T.paperLine}`, borderRadius: 10, padding: "8px 10px", background: T.paperDim, fontSize: 13 }}
            >
              <Clock size={14} color={req.status === "rejected" ? T.expense : T.gold} />
              <span className="mono" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
                {req.bookId}
              </span>
              <span style={{ fontWeight: 600, color: req.status === "rejected" ? T.expense : T.gold, flexShrink: 0 }}>
                {req.status === "rejected" ? "ถูกปฏิเสธ" : "รออนุมัติ"}
              </span>
              <button
                onClick={() => run(() => onCancelRequest(req.bookId))}
                aria-label={req.status === "rejected" ? "ปิดการแจ้งเตือน" : "ยกเลิกคำขอ"}
                title={req.status === "rejected" ? "ปิด" : "ยกเลิกคำขอ"}
                style={{ marginLeft: "auto", border: "none", background: "transparent", color: T.inkSoft, display: "flex", padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      {activeBook?.kind === "shared" && (
        <BookMembers
          book={activeBook}
          currentUid={currentUid}
          onChangeMemberRole={onChangeMemberRole}
          onRemoveMember={onRemoveMember}
          onLeaveBook={onLeaveBook}
          onUpdateBookName={onUpdateBookName}
          onDeleteBook={onDeleteBook}
        />
      )}

      {notice && (
        <div style={{ marginTop: 10, border: `1px solid ${T.paperLine}`, borderRadius: 10, padding: "8px 10px", background: T.paperDim, color: T.ink, fontSize: 13, fontWeight: 600 }}>
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" style={{ color: T.expense, fontSize: 13, marginTop: 10 }}>
          {error}
        </div>
      )}
    </section>
  );
}
