import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Copy, UserCheck, Users, X } from "lucide-react";
import { ActiveBook, BookRole } from "../types";
import { useJoinRequests } from "../hooks/useBooks";
import { useAction } from "../hooks/useAction";
import { T } from "../theme";
import { Field, inputStyle, primaryBtn } from "./shared";

type SharedActiveBook = Extract<ActiveBook, { kind: "shared" }>;

const ROLE_LABEL: Record<BookRole, string> = { owner: "เจ้าของ", editor: "แก้ไขได้", viewer: "ดูอย่างเดียว" };

const dangerBtn = { ...primaryBtn, padding: "7px 10px", background: T.expense, color: T.paper };

export function BookMembers({
  book,
  currentUid,
  onChangeMemberRole,
  onRemoveMember,
  onLeaveBook,
  onUpdateBookName,
  onDeleteBook,
}: {
  book: SharedActiveBook;
  currentUid?: string;
  onChangeMemberRole: (bookId: string, targetUid: string, role: BookRole) => Promise<void>;
  onRemoveMember: (bookId: string, targetUid: string) => Promise<void>;
  onLeaveBook: (bookId: string) => Promise<void>;
  onUpdateBookName: (bookId: string, name: string) => Promise<void>;
  onDeleteBook: (bookId: string) => Promise<void>;
}) {
  const isOwner = currentUid === book.ownerUid;
  const { requests, approve, reject, clear } = useJoinRequests(isOwner ? book.id : null);
  const { busy, error, notice, run, reset } = useAction();
  const [membersOpen, setMembersOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [renameValue, setRenameValue] = useState(book.name);
  const [copied, setCopied] = useState(false);
  const [approveRole, setApproveRole] = useState<Record<string, BookRole>>({});

  const copyId = async () => {
    try {
      await navigator.clipboard.writeText(book.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked — the id is still visible on screen
    }
  };

  const confirmThen = (message: string, task: () => Promise<void>) => {
    if (window.confirm(message)) run(task);
  };

  return (
    <>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, color: T.inkSoft, fontSize: 13, flexWrap: "wrap" }}>
        <Users size={14} />
        <span>{book.memberIds.length} members</span>
        <span className="mono" style={{ marginLeft: "auto" }}>ID: {book.id}</span>
        <button onClick={copyId} aria-label="คัดลอก ID สมุด" title="คัดลอก ID เพื่อส่งให้คนที่จะเข้าร่วม" style={{ ...primaryBtn, padding: "6px 9px", background: T.paperDim, color: T.ink, border: `1px solid ${T.paperLine}` }}>
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "คัดลอกแล้ว" : "คัดลอก ID"}
        </button>
        {isOwner && (
          <button
            onClick={() => {
              setSettingsOpen((v) => !v);
              setRenameValue(book.name);
              reset();
            }}
            style={{ ...primaryBtn, padding: "7px 10px" }}
          >
            ตั้งค่า
          </button>
        )}
      </div>

      {isOwner && requests.length > 0 && (
        <div style={{ marginTop: 10, border: `1px solid ${T.gold}`, borderRadius: 10, padding: 10, background: T.goldBg }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, fontWeight: 700, marginBottom: 6 }}>
            <UserCheck size={14} /> คำขอเข้าร่วม ({requests.filter((r) => r.status === "pending").length})
          </div>
          {requests.map((req) => (
            <div key={req.id} style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", padding: "8px 0", borderTop: `1px solid ${T.paperLine}` }}>
              <div style={{ flex: "1 1 140px", minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{req.requesterName}</div>
                <div style={{ fontSize: 12, color: T.inkSoft }}>{req.status === "rejected" ? "ปฏิเสธแล้ว" : "รออนุมัติ"}</div>
              </div>
              {req.status === "pending" ? (
                <>
                  <select
                    aria-label={`สิทธิ์ของ ${req.requesterName}`}
                    value={approveRole[req.id] ?? "viewer"}
                    onChange={(e) => setApproveRole((prev) => ({ ...prev, [req.id]: e.target.value as BookRole }))}
                    style={{ ...inputStyle, marginTop: 0, width: 130, minWidth: 130 }}
                  >
                    <option value="viewer">ดูอย่างเดียว</option>
                    <option value="editor">แก้ไขได้</option>
                  </select>
                  <button disabled={busy} onClick={() => run(() => approve(req, approveRole[req.id] ?? "viewer"), `อนุมัติ ${req.requesterName} แล้ว`)} style={{ ...primaryBtn, padding: "7px 10px", background: T.income }}>
                    <Check size={13} /> อนุมัติ
                  </button>
                  <button disabled={busy} onClick={() => run(() => reject(req))} style={dangerBtn}>
                    <X size={13} /> ปฏิเสธ
                  </button>
                </>
              ) : (
                <button disabled={busy} onClick={() => run(() => clear(req))} style={{ ...primaryBtn, padding: "7px 10px", background: T.paperLine, color: T.ink }}>
                  ลบออก
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {isOwner && settingsOpen && (
        <div style={{ marginTop: 10, border: `1px solid ${T.paperLine}`, borderRadius: 10, padding: 10, background: T.paperDim }}>
          <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8 }}>จัดการสมุดบัญชี</div>
          <div style={{ display: "flex", gap: 8, alignItems: "end", flexWrap: "wrap" }}>
            <Field label="เปลี่ยนชื่อสมุดบัญชี">
              <input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} placeholder="ชื่อใหม่" maxLength={80} style={inputStyle} />
            </Field>
            <button disabled={busy || !renameValue.trim()} onClick={() => run(() => onUpdateBookName(book.id, renameValue), "บันทึกชื่อแล้ว")} style={{ ...primaryBtn, padding: "8px 10px" }}>
              บันทึกชื่อ
            </button>
          </div>
          <button
            disabled={busy}
            onClick={() => confirmThen(`ลบสมุด "${book.name}" ?\nสมาชิกทุกคนจะมองไม่เห็นสมุดนี้อีก`, () => onDeleteBook(book.id))}
            style={{ ...dangerBtn, marginTop: 10, padding: "8px 10px" }}
          >
            ลบสมุดบัญชี
          </button>
        </div>
      )}

      <div style={{ marginTop: 12, border: `1px solid ${T.paperLine}`, borderRadius: 10, padding: 10, background: T.paperDim }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: membersOpen ? 8 : 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>สมาชิกในสมุด</div>
          <button
            type="button"
            onClick={() => setMembersOpen((v) => !v)}
            style={{ border: "none", background: "transparent", color: T.inkSoft, display: "flex", alignItems: "center" }}
            aria-label={membersOpen ? "ย่อรายชื่อสมาชิก" : "ขยายรายชื่อสมาชิก"}
          >
            {membersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        </div>
        {membersOpen && (
          <>
            {Object.entries(book.members).map(([memberUid, member]) => (
              <div key={memberUid} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8, padding: "8px 0", borderTop: `1px solid ${T.paperLine}` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>{member.name}</div>
                  <div style={{ fontSize: 12, color: T.inkSoft }}>{ROLE_LABEL[member.role]}</div>
                </div>
                {isOwner && memberUid !== book.ownerUid && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <select
                      aria-label={`สิทธิ์ของ ${member.name}`}
                      value={member.role}
                      onChange={(e) => run(() => onChangeMemberRole(book.id, memberUid, e.target.value as BookRole))}
                      style={{ ...inputStyle, marginTop: 0, minWidth: 130, width: 130 }}
                    >
                      <option value="editor">แก้ไขได้</option>
                      <option value="viewer">ดูอย่างเดียว</option>
                    </select>
                    <button disabled={busy} onClick={() => confirmThen(`ลบ ${member.name} ออกจากสมุด?`, () => onRemoveMember(book.id, memberUid))} style={dangerBtn}>
                      ลบ
                    </button>
                  </div>
                )}
              </div>
            ))}
            {!isOwner && (
              <button disabled={busy} onClick={() => confirmThen(`ออกจากสมุด "${book.name}" ?`, () => onLeaveBook(book.id))} style={{ ...dangerBtn, marginTop: 8 }}>
                ออกจากสมุดบัญชี
              </button>
            )}
          </>
        )}
      </div>

      {notice && (
        <div style={{ marginTop: 10, border: `1px solid ${T.paperLine}`, borderRadius: 10, padding: "8px 10px", background: T.paperDim, fontSize: 13, fontWeight: 600 }}>
          {notice}
        </div>
      )}
      {error && (
        <div role="alert" style={{ color: T.expense, fontSize: 13, marginTop: 10 }}>
          {error}
        </div>
      )}
    </>
  );
}
