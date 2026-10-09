import { useState } from "react";
import { Check, Save } from "lucide-react";
import { User } from "firebase/auth";
import { T } from "../theme";
import { useTheme } from "../hooks/useTheme";
import { Avatar, Card, Segmented, inputStyle, primaryBtn } from "./shared";

export function ProfileView({
  user,
  onSave,
}: {
  user: User;
  onSave: (profile: { displayName: string; photoURL: string }) => Promise<void>;
}) {
  const [displayName, setDisplayName] = useState(user.displayName || "");
  const [photoURL, setPhotoURL] = useState(user.photoURL || "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const { pref, setPref } = useTheme();

  const nameForPreview = displayName.trim() || user.email || "User";

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await onSave({ displayName, photoURL });
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1600);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <Card title="ข้อมูลส่วนตัว">
        <div style={{ display: "flex", gap: 22, alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, margin: "0 auto" }}>
            <div style={{ borderRadius: "50%", padding: 4, background: T.hero }}>
              <div style={{ borderRadius: "50%", border: `3px solid ${T.paper}`, overflow: "hidden", display: "flex" }}>
                <Avatar name={nameForPreview} photoURL={photoURL.trim() || null} size={88} />
              </div>
            </div>
            <div style={{ color: T.inkSoft, fontSize: 12 }}>ตัวอย่างรูปโปรไฟล์</div>
          </div>

          <div style={{ flex: "1 1 260px", minWidth: 0 }}>
            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.inkSoft }}>
              ชื่อที่แสดง
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder={user.email || "ชื่อของคุณ"} style={inputStyle} />
            </label>

            <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.inkSoft, marginTop: 14 }}>
              ลิงก์รูปโปรไฟล์
              <input value={photoURL} onChange={(e) => setPhotoURL(e.target.value)} placeholder="https://example.com/me.jpg" style={inputStyle} />
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 18, flexWrap: "wrap" }}>
              <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
                {saved ? <Check size={16} /> : <Save size={16} />}
                {saved ? "บันทึกแล้ว" : saving ? "กำลังบันทึก..." : "บันทึกโปรไฟล์"}
              </button>
              <span style={{ color: T.inkSoft, fontSize: 13, overflowWrap: "anywhere" }}>{user.email}</span>
            </div>
          </div>
        </div>
      </Card>

      <Card title="การแสดงผล">
        <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 12 }}>เลือกธีมสว่าง/มืด หรือให้ตามการตั้งค่าของอุปกรณ์</div>
        <ThemeOptions pref={pref} setPref={setPref} />
      </Card>
    </div>
  );
}

function ThemeOptions({ pref, setPref }: ReturnType<typeof useTheme>) {
  return (
    <Segmented
      ariaLabel="ธีม"
      value={pref}
      onChange={setPref}
      options={[
        { id: "system", label: "ตามระบบ" },
        { id: "light", label: "สว่าง" },
        { id: "dark", label: "มืด" },
      ]}
    />
  );
}
