import React from "react";
import { BarChart3, Users, Zap, Wallet } from "lucide-react";
import { T } from "../theme";
import { useAuth } from "../contexts/AuthContext";
import { ThemeToggle } from "./Layout";

const FEATURES = [
  { icon: Zap, title: "บันทึกได้ในไม่กี่วินาที", text: "กรอกจำนวน เลือกหมวด จบ — ใช้ได้ทั้งมือถือและคอมพิวเตอร์" },
  { icon: BarChart3, title: "เห็นภาพรวมด้วยกราฟ", text: "แนวโน้มรายวัน เปรียบเทียบรายเดือน และสัดส่วนรายจ่าย" },
  { icon: Users, title: "แชร์สมุดกับครอบครัว", text: "เชิญคนอื่นเข้าสมุดร่วม เจ้าของสมุดเป็นผู้อนุมัติ" },
];

export function Login() {
  const { signInWithGoogle, accountDeleted, dismissAccountDeleted } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);

  const handleClick = async () => {
    setError(null);
    setBusy(true);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError("เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sn-login" style={{ position: "relative" }}>
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 5 }}>
        <ThemeToggle />
      </div>
      <section
        className="sn-login-hero"
        style={{ background: T.hero, color: "#fff", padding: "56px 56px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative", overflow: "hidden" }}
      >
        <div aria-hidden="true" style={{ position: "absolute", width: 380, height: 380, borderRadius: "50%", background: "rgba(255,255,255,0.07)", top: -120, right: -100 }} />
        <div aria-hidden="true" style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.06)", bottom: -90, left: -60 }} />

        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative" }}>
          <div style={{ width: 42, height: 42, borderRadius: 14, background: "rgba(255,255,255,0.18)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Wallet size={22} />
          </div>
          <span style={{ fontWeight: 800, fontSize: 20, letterSpacing: -0.2 }}>สมุดเงิน</span>
        </div>

        <div style={{ position: "relative", margin: "40px 0" }}>
          <h1 style={{ fontSize: "clamp(30px, 4.2vw, 46px)", fontWeight: 800, letterSpacing: -1, lineHeight: 1.15, maxWidth: 520 }}>
            จัดการเงินของคุณ
            <br />
            ให้ง่ายในที่เดียว
          </h1>
          <p style={{ fontSize: 16, opacity: 0.85, marginTop: 14, maxWidth: 460 }}>
            บันทึกรายรับรายจ่ายทุกวัน ดูแนวโน้มการใช้จ่าย และแชร์สมุดบัญชีกับคนที่คุณไว้ใจ
          </p>
        </div>

        <ul className="sn-login-extra" style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: 16, position: "relative", maxWidth: 520 }}>
          {FEATURES.map(({ icon: Icon, title, text }) => (
            <li key={title} style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
              <div style={{ width: 38, height: 38, borderRadius: 12, background: "rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <Icon size={18} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
                <div style={{ fontSize: 13.5, opacity: 0.8 }}>{text}</div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <main className="sn-login-panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: 24, position: "relative" }}>
        <div className="sn-card sn-page" style={{ width: "100%", maxWidth: 400, padding: "34px 30px", textAlign: "center", boxShadow: "var(--shadow-lg)" }}>
          {accountDeleted && (
            <div role="status" style={{ background: T.incomeBg, color: T.income, borderRadius: 14, padding: "12px 14px", fontSize: 14, fontWeight: 600, marginBottom: 20, textAlign: "left" }}>
              ลบบัญชีและข้อมูลของคุณเรียบร้อยแล้ว
              <button onClick={dismissAccountDeleted} style={{ display: "block", marginTop: 4, background: "transparent", border: "none", color: "inherit", fontSize: 12.5, fontWeight: 500, padding: 0, textDecoration: "underline" }}>ปิด</button>
            </div>
          )}
          <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: -0.4 }}>ยินดีต้อนรับ</h2>
          <p style={{ fontSize: 14, color: T.inkSoft, margin: "6px 0 26px" }}>เข้าสู่ระบบเพื่อเริ่มบันทึกรายรับรายจ่าย</p>
          <button
            onClick={handleClick}
            disabled={busy}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "14px 0", borderRadius: 14, border: `1px solid ${T.paperLine}`, background: T.paper, fontSize: 15, fontWeight: 700, color: T.ink, boxShadow: T.shadow, opacity: busy ? 0.7 : 1 }}
          >
            <GoogleIcon />
            {busy ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}
          </button>
          {error && (
            <p role="alert" style={{ color: T.expense, fontSize: 13.5, marginTop: 14 }}>
              {error}
            </p>
          )}
          <p style={{ fontSize: 12, color: T.inkSoft, marginTop: 22 }}>ข้อมูลของคุณถูกแยกเก็บเป็นส่วนตัวตามบัญชี Google</p>
        </div>
      </main>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 18 18" aria-hidden="true">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
