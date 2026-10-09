import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Check, Download, Loader2, Trash2 } from "lucide-react";
import { User } from "firebase/auth";
import { T } from "../theme";
import { useAuth } from "../contexts/AuthContext";
import { DeletionPlan, DeletionStep, DELETED_USER_NAME, exportPersonalCsv, planAccountDeletion } from "../lib/accountDeletion";
import { inputStyle, primaryBtn, secondaryBtn } from "./shared";

/** What the user must type to arm the delete button. */
export const CONFIRM_PHRASE = "ลบบัญชี";

const STEPS: { id: DeletionStep; label: string }[] = [
  { id: "reauth", label: "ยืนยันตัวตนด้วย Google" },
  { id: "personal", label: "ลบรายการรับ-จ่ายส่วนตัว" },
  { id: "books", label: "จัดการสมุดร่วม" },
  { id: "account", label: "ลบบัญชีผู้ใช้" },
];

function errorMessage(err: unknown): string {
  const code = (err as { code?: string })?.code ?? "";
  if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return "ยกเลิกการยืนยันตัวตน ยังไม่มีข้อมูลใดถูกลบ";
  if (code === "auth/popup-blocked") return "เบราว์เซอร์บล็อกหน้าต่างยืนยันตัวตน กรุณาอนุญาต pop-up แล้วลองอีกครั้ง";
  if (code === "auth/user-mismatch") return "บัญชี Google ที่เลือกไม่ตรงกับบัญชีที่ล็อกอินอยู่ กรุณาเลือกบัญชีเดิม";
  if (code === "auth/requires-recent-login") return "ต้องยืนยันตัวตนใหม่ กรุณาลองอีกครั้ง";
  const msg = err instanceof Error ? err.message : "";
  return msg.includes("permission") ? "ไม่มีสิทธิ์ลบข้อมูลบางส่วน กรุณาลองอีกครั้ง หากยังไม่สำเร็จให้ติดต่อผู้ดูแล" : msg || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง";
}

/** "Danger zone" card on the profile page + the confirmation dialog. */
export function DeleteAccountCard({ user }: { user: User }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <section className="sn-card" style={{ padding: "18px 20px", borderColor: T.expense }} aria-labelledby="danger-title">
        <h2 id="danger-title" style={{ fontSize: 15, fontWeight: 700, color: T.expense, display: "flex", alignItems: "center", gap: 8 }}>
          <AlertTriangle size={17} /> ลบบัญชี
        </h2>
        <p style={{ fontSize: 14, color: T.inkSoft, margin: "8px 0 14px", lineHeight: 1.55 }}>
          หากไม่ต้องการใช้งานแล้ว คุณสามารถลบบัญชีและข้อมูลทั้งหมดของคุณได้ถาวร การกระทำนี้ไม่สามารถย้อนกลับได้
        </p>
        <button onClick={() => setOpen(true)} style={{ ...primaryBtn, background: T.expenseBg, color: T.expense, border: `1px solid ${T.expense}` }}>
          <Trash2 size={16} /> ลบบัญชีของฉัน
        </button>
      </section>
      {open && <DeleteAccountDialog user={user} onClose={() => setOpen(false)} />}
    </>
  );
}

function DeleteAccountDialog({ user, onClose }: { user: User; onClose: () => void }) {
  const { deleteAccount } = useAuth();
  const [plan, setPlan] = useState<DeletionPlan | null>(null);
  const [planError, setPlanError] = useState("");
  const [phrase, setPhrase] = useState("");
  const [step, setStep] = useState<DeletionStep | null>(null);
  const [error, setError] = useState("");
  const running = step !== null;

  useEffect(() => {
    let cancelled = false;
    planAccountDeletion(user.uid)
      .then((p) => !cancelled && setPlan(p))
      .catch((e) => {
        console.error(e);
        if (!cancelled) setPlanError("โหลดสรุปข้อมูลไม่สำเร็จ แต่ยังสามารถลบบัญชีได้");
      });
    return () => {
      cancelled = true;
    };
  }, [user.uid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !running && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [running, onClose]);

  const downloadCsv = async () => {
    try {
      const csv = await exportPersonalCsv(user.uid);
      const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "sood-ngern-export.csv";
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
      setError("ส่งออกข้อมูลไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  const confirm = async () => {
    setError("");
    try {
      await deleteAccount(setStep);
      // On success the auth listener signs the user out and the login page confirms deletion.
    } catch (e) {
      console.error(e);
      setError(errorMessage(e));
      setStep(null);
    }
  };

  const armed = phrase.trim() === CONFIRM_PHRASE;

  // Portal to <body>: an animated ancestor would otherwise act as the containing block of position: fixed.
  return createPortal(
    <div
      style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, padding: 16, overflowY: "auto" }}
      onClick={() => !running && onClose()}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        className="sn-page"
        onClick={(e) => e.stopPropagation()}
        style={{ background: T.paper, border: `1px solid ${T.paperLine}`, borderRadius: 20, padding: "22px 22px 18px", width: "100%", maxWidth: 480, boxShadow: "var(--shadow-lg)", margin: "auto" }}
      >
        <h2 id="delete-title" style={{ fontSize: 18, fontWeight: 800, display: "flex", alignItems: "center", gap: 8, color: T.expense }}>
          <AlertTriangle size={20} /> ลบบัญชีถาวร
        </h2>

        {running ? (
          <ol style={{ listStyle: "none", margin: "18px 0 6px", padding: 0, display: "grid", gap: 12 }} aria-live="polite">
            {STEPS.map((s, i) => {
              const current = STEPS.findIndex((x) => x.id === step);
              const state = i < current ? "done" : i === current ? "active" : "todo";
              return (
                <li key={s.id} style={{ display: "flex", alignItems: "center", gap: 10, color: state === "todo" ? T.inkSoft : T.ink, fontWeight: state === "active" ? 700 : 500 }}>
                  {state === "done" ? <Check size={18} color="var(--income)" /> : state === "active" ? <Loader2 size={18} className="sn-spin-icon" /> : <span style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid ${T.paperLine}` }} />}
                  {s.label}
                </li>
              );
            })}
          </ol>
        ) : (
          <>
            <p style={{ fontSize: 14, color: T.inkSoft, margin: "8px 0 14px" }}>
              บัญชี <b style={{ color: T.ink }}>{user.email}</b> และข้อมูลต่อไปนี้จะถูกลบ <b style={{ color: T.expense }}>ถาวร</b> ไม่สามารถกู้คืนได้
            </p>

            <div style={{ display: "grid", gap: 10, fontSize: 14 }}>
              {!plan && !planError && <div style={{ color: T.inkSoft }}>กำลังสรุปข้อมูลของคุณ...</div>}
              {planError && <div style={{ color: T.inkSoft }}>{planError}</div>}
              {plan && (
                <>
                  <Item>
                    รายการรับ-จ่ายส่วนตัว <b>{plan.personalCount.toLocaleString("th-TH")}</b> รายการ
                  </Item>
                  {plan.ownedBooks.length > 0 && (
                    <Item tone="danger">
                      สมุดร่วมที่คุณ<b>เป็นเจ้าของ</b> จะถูกลบ<b>ให้ทุกคน</b> (สมาชิกคนอื่นจะเข้าไม่ได้อีก):
                      <ul style={{ margin: "6px 0 0", paddingLeft: 18 }}>
                        {plan.ownedBooks.map((b) => (
                          <li key={b.id}>
                            {b.name} <span style={{ color: T.inkSoft }}>({b.memberCount} สมาชิก)</span>
                          </li>
                        ))}
                      </ul>
                    </Item>
                  )}
                  {plan.joinedBooks.length > 0 && (
                    <Item>
                      สมุดร่วมที่คุณ<b>เป็นสมาชิก</b> ({plan.joinedBooks.map((b) => b.name).join(", ")}) — คุณจะถูกนำออกจากสมุด สมุดยังอยู่สำหรับคนอื่น รายการที่คุณเคยบันทึกจะแสดงชื่อเป็น “{DELETED_USER_NAME}”
                    </Item>
                  )}
                  <Item>บัญชีเข้าสู่ระบบ (Google) และข้อมูลโปรไฟล์ของแอปนี้</Item>
                </>
              )}
            </div>

            {plan && plan.personalCount > 0 && (
              <button onClick={downloadCsv} style={{ ...secondaryBtn, marginTop: 14, fontSize: 13 }}>
                <Download size={15} /> ดาวน์โหลดรายการส่วนตัวเป็น CSV ก่อนลบ
              </button>
            )}

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.inkSoft, marginTop: 18 }}>
              พิมพ์ “{CONFIRM_PHRASE}” เพื่อยืนยัน
              <input value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder={CONFIRM_PHRASE} autoComplete="off" style={inputStyle} />
            </label>
          </>
        )}

        {error && (
          <div role="alert" style={{ color: T.expense, fontSize: 13.5, marginTop: 14 }}>
            {error}
          </div>
        )}

        {!running && (
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 20, flexWrap: "wrap" }}>
            <button onClick={onClose} style={secondaryBtn} autoFocus>
              ยกเลิก
            </button>
            <button
              onClick={confirm}
              disabled={!armed}
              style={{ ...primaryBtn, background: T.expense, color: "#fff", opacity: armed ? 1 : 0.4 }}
            >
              <Trash2 size={16} /> ลบบัญชีถาวร
            </button>
          </div>
        )}
        {running && <p style={{ fontSize: 12.5, color: T.inkSoft, marginTop: 12 }}>กรุณาอย่าปิดหน้านี้ระหว่างดำเนินการ</p>}
      </div>
    </div>,
    document.body
  );
}

function Item({ children, tone }: { children: React.ReactNode; tone?: "danger" }) {
  return (
    <div style={{ padding: "10px 12px", borderRadius: 12, background: tone === "danger" ? T.expenseBg : T.paperDim, lineHeight: 1.5 }}>{children}</div>
  );
}
