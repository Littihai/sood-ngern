import React from "react";
import { BookOpen, LayoutGrid, Calendar, Plus, LogOut } from "lucide-react";
import { User } from "firebase/auth";
import { T } from "../theme";
import { Tab } from "../types";

export const NAV_ITEMS: { id: Tab; label: string; icon: typeof LayoutGrid }[] = [
  { id: "dashboard", label: "ภาพรวม", icon: LayoutGrid },
  { id: "daily", label: "รายวัน", icon: Calendar },
  { id: "add", label: "บันทึก", icon: Plus },
  { id: "summary", label: "สรุป", icon: BookOpen },
];

export function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{ width: 34, height: 34, borderRadius: 8, background: T.ink, display: "flex", alignItems: "center", justifyContent: "center", color: T.paper, flexShrink: 0 }}>
        <BookOpen size={18} strokeWidth={2} />
      </div>
      <div>
        <div style={{ fontWeight: 600, fontSize: 16, letterSpacing: 0.2 }}>สมุดเงิน</div>
        <div style={{ fontSize: 11, color: T.inkSoft }}>บัญชีรายรับรายจ่าย</div>
      </div>
    </div>
  );
}

export function Sidebar({ tab, setTab, user, onSignOut }: { tab: Tab; setTab: (t: Tab) => void; user: User; onSignOut: () => void }) {
  return (
    <aside
      className="sn-sidebar"
      style={{ width: 232, borderRight: `1px solid ${T.paperLine}`, background: T.paperDim, position: "fixed", top: 0, bottom: 0, left: 0, padding: "28px 18px", display: "flex", flexDirection: "column" }}
    >
      <Brand />
      <nav style={{ marginTop: 36, display: "flex", flexDirection: "column", gap: 4 }}>
        {NAV_ITEMS.map((item) => (
          <SidebarLink key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
        ))}
      </nav>
      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 10 }}>
        <UserChip user={user} />
        <button onClick={onSignOut} style={{ display: "flex", alignItems: "center", gap: 8, background: "transparent", border: `1px solid ${T.paperLine}`, borderRadius: 8, padding: "8px 10px", fontSize: 12.5, color: T.inkSoft, fontWeight: 500 }}>
          <LogOut size={14} /> ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active, onClick }: { item: (typeof NAV_ITEMS)[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 12px", borderRadius: 8, border: "none", background: active ? T.ink : "transparent", color: active ? T.paper : T.ink, fontSize: 14, fontWeight: active ? 600 : 500, textAlign: "left" }}
    >
      <Icon size={17} strokeWidth={2} />
      {item.label}
    </button>
  );
}

function UserChip({ user }: { user: User }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      {user.photoURL ? (
        <img src={user.photoURL} alt="" style={{ width: 28, height: 28, borderRadius: "50%" }} />
      ) : (
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: T.paperLine, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 600 }}>
          {(user.displayName || user.email || "?").charAt(0).toUpperCase()}
        </div>
      )}
      <div style={{ fontSize: 12.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
        {user.displayName || user.email}
      </div>
    </div>
  );
}

export function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  return (
    <nav
      className="sn-bottomnav"
      style={{ display: "none", position: "fixed", left: 0, right: 0, bottom: 0, background: T.paperDim, borderTop: `1px solid ${T.paperLine}`, padding: "8px 6px 10px", justifyContent: "space-around", alignItems: "center", zIndex: 20 }}
    >
      {NAV_ITEMS.map((item) => (
        <BottomNavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
      ))}
    </nav>
  );
}

function BottomNavButton({ item, active, onClick }: { item: (typeof NAV_ITEMS)[number]; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const isAdd = item.id === "add";
  return (
    <button onClick={onClick} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", color: active ? T.ink : T.inkSoft, padding: 4, minWidth: 56 }}>
      <div
        style={{
          width: isAdd ? 40 : 28, height: isAdd ? 40 : 28, borderRadius: isAdd ? 20 : 8,
          background: isAdd ? T.ink : active ? T.paperLine : "transparent", color: isAdd ? T.paper : T.ink,
          display: "flex", alignItems: "center", justifyContent: "center", marginTop: isAdd ? -18 : 0,
          boxShadow: isAdd ? "0 2px 0 rgba(36,33,28,0.15)" : "none",
        }}
      >
        <Icon size={isAdd ? 20 : 16} strokeWidth={2.2} />
      </div>
      <span style={{ fontSize: 10.5, fontWeight: active ? 600 : 500 }}>{item.label}</span>
    </button>
  );
}

const TITLES: Record<Tab, [string, string]> = {
  dashboard: ["ภาพรวมบัญชี", "สรุปเงินเข้า-ออกของคุณ"],
  add: ["บันทึกรายการ", "เพิ่มรายรับหรือรายจ่ายใหม่"],
  daily: ["บันทึกรายวัน", "ดูรายการตามวันที่เลือก"],
  summary: ["สรุปรายสัปดาห์ / รายเดือน", "แยกตามหมวดหมู่การใช้จ่าย"],
};

export function TopHeader({ tab }: { tab: Tab }) {
  const [h, sub] = TITLES[tab];
  return (
    <div style={{ marginBottom: 20 }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}>{h}</h1>
      <p style={{ fontSize: 13, color: T.inkSoft, margin: "4px 0 0" }}>{sub}</p>
    </div>
  );
}

export function LoadingState({ label = "กำลังเปิดสมุดบัญชี..." }: { label?: string }) {
  return <div style={{ padding: 40, textAlign: "center", color: T.inkSoft, fontSize: 14 }}>{label}</div>;
}
