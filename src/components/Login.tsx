import React from "react";
import { BookOpen } from "lucide-react";
import { T } from "../theme";
import { useAuth } from "../contexts/AuthContext";

export function Login() {
  const { signInWithGoogle } = useAuth();
  const [error, setError] = React.useState<string | null>(null);

  const handleClick = async () => {
    setError(null);
    try {
      await signInWithGoogle();
    } catch (e) {
      setError("เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง");
      console.error(e);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ maxWidth: 340, width: "100%", textAlign: "center" }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", color: T.paper, margin: "0 auto 18px" }}>
          <BookOpen size={26} strokeWidth={2} />
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>สมุดเงิน</h1>
        <p style={{ fontSize: 13.5, color: T.inkSoft, margin: "6px 0 28px" }}>
          บันทึกรายรับรายจ่ายทุกวัน เข้าสู่ระบบเพื่อเริ่มใช้งาน
        </p>
        <button
          onClick={handleClick}
          style={{
            width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10,
            padding: "11px 0", borderRadius: 10, border: `1px solid ${T.paperLine}`, background: T.paper,
            fontSize: 14, fontWeight: 600, color: T.ink,
          }}
        >
          <GoogleIcon />
          เข้าสู่ระบบด้วย Google
        </button>
        {error && <p style={{ color: T.expense, fontSize: 12.5, marginTop: 12 }}>{error}</p>}
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18">
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.85.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z" />
      <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.59-2.59C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z" />
    </svg>
  );
}
