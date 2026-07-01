import {
  Utensils, Car, ShoppingBag, Receipt, Film, HeartPulse, GraduationCap,
  MoreHorizontal, Briefcase, Gift, Building2, Sparkles, LucideIcon,
} from "lucide-react";
import { TransactionType } from "./types";

export const T = {
  paper: "#FBF8F2",
  paperDim: "#F2ECDD",
  paperLine: "#E1D9C4",
  ink: "#24211C",
  inkSoft: "#6B6558",
  income: "#2F6D46",
  incomeBg: "#E3EDE1",
  expense: "#B23A2A",
  expenseBg: "#F6E3DC",
  gold: "#AD7F26",
  goldBg: "#F3E9D2",
};

export const FONT_IMPORT = `@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');`;

export interface Category {
  id: string;
  label: string;
  icon: LucideIcon;
  color: string;
}

export const EXPENSE_CATS: Category[] = [
  { id: "food", label: "อาหาร", icon: Utensils, color: "#B23A2A" },
  { id: "transport", label: "เดินทาง", icon: Car, color: "#8A5A2E" },
  { id: "shopping", label: "ช้อปปิ้ง", icon: ShoppingBag, color: "#A6467A" },
  { id: "bills", label: "บิล/ประจำ", icon: Receipt, color: "#4A5C8A" },
  { id: "fun", label: "บันเทิง", icon: Film, color: "#7B4FA0" },
  { id: "health", label: "ของขาย", icon: HeartPulse, color: "#C2504F" },
  { id: "edu", label: "การศึกษา", icon: GraduationCap, color: "#2E7D6B" },
  { id: "other_e", label: "อื่นๆ", icon: MoreHorizontal, color: "#8A8577" },
];

export const INCOME_CATS: Category[] = [
  { id: "salary", label: "เงินเดือน", icon: Briefcase, color: "#2F6D46" },
  { id: "bonus", label: "โบนัส", icon: Gift, color: "#3C8A5C" },
  { id: "biz", label: "ธุรกิจ", icon: Building2, color: "#5A9A6E" },
  { id: "gift", label: "ของขวัญ", icon: Sparkles, color: "#7AA85C" },
  { id: "other_i", label: "อื่นๆ", icon: MoreHorizontal, color: "#8A8577" },
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
