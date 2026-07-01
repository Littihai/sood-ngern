import { useState } from "react";
import { Camera, Check, Save, User as UserIcon } from "lucide-react";
import { User } from "firebase/auth";
import { T } from "../theme";
import { Card, inputStyle, primaryBtn } from "./shared";

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

  const nameForPreview = displayName.trim() || user.email || "User";
  const initial = nameForPreview.charAt(0).toUpperCase();

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
      <Card title="Profile">
        <div style={{ display: "grid", gridTemplateColumns: "120px minmax(0, 1fr)", gap: 18, alignItems: "start" }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 92,
                height: 92,
                borderRadius: "50%",
                background: T.paperDim,
                border: `1px solid ${T.paperLine}`,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: T.inkSoft,
              }}
            >
              {photoURL.trim() ? (
                <img src={photoURL.trim()} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <span style={{ fontSize: 30, fontWeight: 700 }}>{initial}</span>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.inkSoft, fontSize: 11 }}>
              <Camera size={13} />
              Preview
            </div>
          </div>

          <div style={{ minWidth: 0 }}>
            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.inkSoft }}>
              Display name
              <input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={user.email || "Your name"}
                style={inputStyle}
              />
            </label>

            <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: T.inkSoft, marginTop: 12 }}>
              Profile photo URL
              <input
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://example.com/me.jpg"
                style={inputStyle}
              />
            </label>

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 16, flexWrap: "wrap" }}>
              <button onClick={handleSave} disabled={saving} style={{ ...primaryBtn, opacity: saving ? 0.6 : 1 }}>
                {saved ? <Check size={15} /> : <Save size={15} />}
                {saved ? "Saved" : saving ? "Saving..." : "Save profile"}
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 6, color: T.inkSoft, fontSize: 12 }}>
                <UserIcon size={13} />
                {user.email}
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
