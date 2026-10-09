import {
  Utensils, Car, ShoppingBag, Receipt, Film, HeartPulse, GraduationCap,
  MoreHorizontal, Briefcase, Gift, Building2, Sparkles, LucideIcon,
} from "lucide-react";
import { TransactionType } from "./types";

/**
 * Design tokens as CSS variables (defined in styles.css) so every inline style
 * follows the light/dark theme. The legacy names (paper/ink/gold) are kept as aliases.
 */
export const T = {
  bg: "var(--bg)",
  paper: "var(--surface)",
  paperDim: "var(--surface-2)",
  paperLine: "var(--border)",
  ink: "var(--text)",
  inkSoft: "var(--muted)",
  primary: "var(--primary)",
  primarySoft: "var(--primary-soft)",
  onPrimary: "var(--on-primary)",
  income: "var(--income)",
  incomeBg: "var(--income-bg)",
  expense: "var(--expense)",
  expenseBg: "var(--expense-bg)",
  gold: "var(--amber)",
  goldBg: "var(--amber-bg)",
  hero: "var(--hero)",
  shadow: "var(--shadow)",
};

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const EXPENSE_CATS: Category[] = [
  { id: "food", label: "อาหาร", icon: Utensils, color: "#F97316" },
  { id: "transport", label: "เดินทาง", icon: Car, color: "#3B82F6" },
  { id: "shopping", label: "ช้อปปิ้ง", icon: ShoppingBag, color: "#EC4899" },
  { id: "bills", label: "บิล/ประจำ", icon: Receipt, color: "#6366F1" },
  { id: "fun", label: "บันเทิง", icon: Film, color: "#A855F7" },
  { id: "health", label: "สุขภาพ", icon: HeartPulse, color: "#EF4444" },
  { id: "edu", label: "การศึกษา", icon: GraduationCap, color: "#14B8A6" },
  { id: "other_e", label: "อื่นๆ", icon: MoreHorizontal, color: "#64748B" },
];

export const INCOME_CATS: Category[] = [
  { id: "salary", label: "เงินเดือน", icon: Briefcase, color: "#10B981" },
  { id: "bonus", label: "โบนัส", icon: Gift, color: "#22C55E" },
  { id: "biz", label: "ธุรกิจ", icon: Building2, color: "#06B6D4" },
  { id: "gift", label: "ของขวัญ", icon: Sparkles, color: "#84CC16" },
  { id: "other_i", label: "อื่นๆ", icon: MoreHorizontal, color: "#64748B" },
];

export const ALL_CATS: Category[] = [...EXPENSE_CATS, ...INCOME_CATS];

export const catById = (id: string): Category =>
  ALL_CATS.find((c) => c.id === id) ?? EXPENSE_CATS[EXPENSE_CATS.length - 1];

export const catsForType = (type: TransactionType): Category[] =>
  type === "expense" ? EXPENSE_CATS : INCOME_CATS;

/* --------------------------------- date/number helpers --------------------------------- */
const pad = (n: number) => String(n).padStart(2, "0");
export const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export const parseISO = (s: string): Date => {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
};
export const todayISO = () => isoDate(new Date());

export const THAI_MONTHS = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];
export const THAI_MONTHS_FULL = ["มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"];
export const THAI_DOW = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];
export const THAI_DOW_FULL = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];

export const fmtMoney = (n: number) =>
  Math.abs(n).toLocaleString("th-TH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const fmtDateLong = (iso: string) => {
  const d = parseISO(iso);
  return `${THAI_DOW_FULL[d.getDay()]}ที่ ${d.getDate()} ${THAI_MONTHS_FULL[d.getMonth()]} ${d.getFullYear() + 543}`;
};
export const fmtDateShort = (iso: string) => {
  const d = parseISO(iso);
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]} ${d.getFullYear() + 543}`;
};

export function startOfWeekMon(d: Date): Date {
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const r = new Date(d);
  r.setDate(d.getDate() + diff);
  r.setHours(0, 0, 0, 0);
  return r;
}
export function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}
