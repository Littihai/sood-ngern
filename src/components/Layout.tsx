import { BookOpen, LayoutGrid, Calendar, Plus, LogOut, UserRound, PieChart, Wallet, Sun, Moon, Monitor, Users } from "lucide-react";
import { User } from "firebase/auth";
import { T } from "../theme";
import { Tab } from "../types";
import { ThemePref, useTheme } from "../hooks/useTheme";
import { Avatar } from "./shared";

type NavItem = { id: Tab; label: string; icon: typeof LayoutGrid };

/** Order matters: the mobile bottom bar renders these left-to-right with "add" as the centre button. */
export const NAV_ITEMS: NavItem[] = [
  { id: "dashboard", label: "ภาพรวม", icon: LayoutGrid },
  { id: "daily", label: "รายวัน", icon: Calendar },
  { id: "add", label: "บันทึก", icon: Plus },
  { id: "summary", label: "สรุป", icon: PieChart },
];
const PROFILE_ITEM: NavItem = { id: "profile", label: "โปรไฟล์", icon: UserRound };

export function Brand() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 38, height: 38, borderRadius: 12, background: T.hero, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0, boxShadow: T.shadow }}>
        <Wallet size={20} strokeWidth={2.2} />
      </div>
      <div>
        <div style={{ fontWeight: 800, fontSize: 17, letterSpacing: -0.2, lineHeight: 1.2 }}>สมุดเงิน</div>
        <div style={{ fontSize: 12, color: T.inkSoft }}>รายรับ-รายจ่ายส่วนตัว</div>
      </div>
    </div>
  );
}

export function Sidebar({ tab, setTab, user, onSignOut }: { tab: Tab; setTab: (t: Tab) => void; user: User; onSignOut: () => void }) {
  const links = [NAV_ITEMS[0], NAV_ITEMS[1], NAV_ITEMS[3], PROFILE_ITEM];
  return (
    <aside
      className="sn-sidebar"
      style={{ width: 248, borderRight: `1px solid ${T.paperLine}`, background: T.paper, position: "fixed", top: 0, bottom: 0, left: 0, padding: "24px 16px 20px", display: "flex", flexDirection: "column", zIndex: 10 }}
    >
      <div style={{ padding: "0 8px" }}>
        <Brand />
      </div>

      <button
        onClick={() => setTab("add")}
        style={{ marginTop: 26, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "12px 14px", borderRadius: 14, border: "none", background: T.primary, color: T.onPrimary, fontSize: 14.5, fontWeight: 700, boxShadow: T.shadow }}
      >
        <Plus size={18} strokeWidth={2.6} /> บันทึกรายการ
      </button>

      <nav aria-label="เมนูหลัก" style={{ marginTop: 22, display: "flex", flexDirection: "column", gap: 4 }}>
        {links.map((item) => (
          <SidebarLink key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
        ))}
      </nav>

      <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: 12 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: 10, borderRadius: 14, background: T.paperDim }}>
          <Avatar name={user.displayName || user.email || "?"} photoURL={user.photoURL} size={34} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 13.5, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.displayName || user.email}</div>
            {user.displayName && user.email && (
              <div style={{ fontSize: 11.5, color: T.inkSoft, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{user.email}</div>
            )}
          </div>
          <button onClick={onSignOut} aria-label="ออกจากระบบ" title="ออกจากระบบ" style={{ background: "transparent", border: "none", color: T.inkSoft, padding: 8, borderRadius: 8, display: "flex" }}>
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
}

function SidebarLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  return (
    <button
      className="sn-nav-item"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "11px 14px", borderRadius: 12, border: "none", background: active ? T.primarySoft : "transparent", color: active ? T.primary : T.ink, fontSize: 14.5, fontWeight: active ? 700 : 500, textAlign: "left" }}
    >
      <Icon size={19} strokeWidth={active ? 2.4 : 2} />
      {item.label}
    </button>
  );
}

export function BottomNav({ tab, setTab }: { tab: Tab; setTab: (t: Tab) => void }) {
  const items = [...NAV_ITEMS, PROFILE_ITEM];
  return (
    <nav
      className="sn-bottomnav"
      aria-label="เมนูหลัก"
      style={{ position: "fixed", left: 0, right: 0, bottom: 0, background: T.paper, borderTop: `1px solid ${T.paperLine}`, padding: "6px 8px calc(8px + env(safe-area-inset-bottom))", justifyContent: "space-around", alignItems: "flex-end", zIndex: 20, boxShadow: "0 -4px 20px rgba(0,0,0,0.05)" }}
    >
      {items.map((item) => (
        <BottomNavButton key={item.id} item={item} active={tab === item.id} onClick={() => setTab(item.id)} />
      ))}
    </nav>
  );
}

function BottomNavButton({ item, active, onClick }: { item: NavItem; active: boolean; onClick: () => void }) {
  const Icon = item.icon;
  const isAdd = item.id === "add";
  return (
    <button
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, background: "transparent", border: "none", color: active || isAdd ? T.primary : T.inkSoft, padding: "4px 2px", minWidth: 60, minHeight: 48 }}
    >
      {isAdd ? (
        <div style={{ width: 52, height: 52, borderRadius: 18, background: T.primary, color: T.onPrimary, display: "flex", alignItems: "center", justifyContent: "center", marginTop: -26, boxShadow: "0 8px 20px rgba(4,120,87,0.35)", border: `4px solid ${T.paper}` }}>
          <Plus size={24} strokeWidth={2.8} />
        </div>
      ) : (
        <div style={{ width: 44, height: 28, borderRadius: 14, background: active ? T.primarySoft : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={19} strokeWidth={active ? 2.5 : 2} />
        </div>
      )}
      <span style={{ fontSize: 11, fontWeight: active || isAdd ? 700 : 500 }}>{item.label}</span>
    </button>
  );
}

/* --------------------------------- page header --------------------------------- */

const TITLES: Record<Tab, [string, string]> = {
  dashboard: ["ภาพรวมบัญชี", "สรุปเงินเข้า-ออกของคุณ"],
  add: ["บันทึกรายการ", "เพิ่มรายรับหรือรายจ่ายใหม่"],
  daily: ["รายวัน", "ดูรายการตามวันที่เลือก"],
  summary: ["สรุป", "รายสัปดาห์ / รายเดือน แยกตามหมวดหมู่"],
  profile: ["โปรไฟล์และสมุดบัญชี", "ชื่อ รูป ธีม และสมุดร่วมกับคนอื่น"],
};

const THEME_CYCLE: ThemePref[] = ["system", "light", "dark"];
const THEME_ICON = { system: Monitor, light: Sun, dark: Moon } as const;
const THEME_LABEL = { system: "ตามระบบ", light: "สว่าง", dark: "มืด" } as const;

export function ThemeToggle() {
  const { pref, setPref } = useTheme();
  const next = THEME_CYCLE[(THEME_CYCLE.indexOf(pref) + 1) % THEME_CYCLE.length];
  const Icon = THEME_ICON[pref];
  return (
    <button
      onClick={() => setPref(next)}
      aria-label={`ธีม: ${THEME_LABEL[pref]} (กดเพื่อเปลี่ยนเป็น${THEME_LABEL[next]})`}
      title={`ธีม: ${THEME_LABEL[pref]}`}
      style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${T.paperLine}`, background: T.paper, color: T.ink, display: "inline-flex", alignItems: "center", justifyContent: "center", boxShadow: T.shadow }}
    >
      <Icon size={18} />
    </button>
  );
}

export function TopHeader({ tab, bookName, onBookClick }: { tab: Tab; bookName?: string; onBookClick?: () => void }) {
  const [h, sub] = TITLES[tab];
  return (
    <header style={{ marginBottom: 22, display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
      <div style={{ minWidth: 0 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: -0.4, lineHeight: 1.25 }}>{h}</h1>
        <p style={{ fontSize: 14, color: T.inkSoft, marginTop: 2 }}>{sub}</p>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {bookName && (
          <button
            onClick={onBookClick}
            title="สมุดที่กำลังใช้ — กดเพื่อเปลี่ยนสมุด"
            style={{ display: "inline-flex", alignItems: "center", gap: 6, maxWidth: 190, height: 40, padding: "0 12px", borderRadius: 12, border: `1px solid ${T.paperLine}`, background: T.paper, color: T.ink, fontSize: 13, fontWeight: 600, boxShadow: T.shadow }}
          >
            {bookName === "Personal book" ? <BookOpen size={15} color={T.primary} /> : <Users size={15} color={T.primary} />}
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{bookName === "Personal book" ? "สมุดส่วนตัว" : bookName}</span>
          </button>
        )}
        <ThemeToggle />
      </div>
    </header>
  );
}

export function LoadingState({ label = "กำลังเปิดสมุดบัญชี..." }: { label?: string }) {
  return (
    <div role="status" style={{ padding: "64px 20px", display: "flex", flexDirection: "column", alignItems: "center", gap: 14, color: T.inkSoft, fontSize: 14 }}>
      <div className="sn-spinner" />
      {label}
    </div>
  );
}
