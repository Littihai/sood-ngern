import React from "react";
import { Wallet, Plus, ArrowDownLeft, ArrowUpRight, PiggyBank } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { T, catById, fmtMoney, isoDate, parseISO, addDays, THAI_DOW, THAI_MONTHS, THAI_MONTHS_FULL } from "../theme";
import { Transaction } from "../types";
import { Card, CategoryIcon, Divider, TxRow, ghostBtn, primaryBtn } from "./shared";

const tooltipStyle = {
  fontSize: 12.5,
  borderRadius: 12,
  border: `1px solid ${T.paperLine}`,
  background: T.paper,
  color: T.ink,
  boxShadow: "var(--shadow-lg)",
};
const axisTick = { fontSize: 12, fill: T.inkSoft };

export function Dashboard({
  transactions,
  onSeeAll,
  onSeeDay,
  onAdd,
}: {
  transactions: Transaction[];
  onSeeAll: () => void;
  onSeeDay: (iso: string) => void;
  onAdd: () => void;
}) {
  const now = new Date();
  const monthTx = transactions.filter((t) => {
    const d = parseISO(t.date);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  });
  const income = monthTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = monthTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const balanceAll = transactions.reduce((s, t) => s + (t.type === "income" ? t.amount : -t.amount), 0);
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = addDays(now, -i);
    const iso = isoDate(d);
    const dayTx = transactions.filter((t) => t.date === iso);
    days.push({
      iso,
      label: THAI_DOW[d.getDay()],
      income: dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
      expense: dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    });
  }

  // last 6 months: income vs expense comparison
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const mTx = transactions.filter((t) => {
      const td = parseISO(t.date);
      return td.getFullYear() === d.getFullYear() && td.getMonth() === d.getMonth();
    });
    const mIncome = mTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const mExpense = mTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    months.push({
      label: THAI_MONTHS[d.getMonth()],
      income: mIncome,
      expense: mExpense,
      net: mIncome - mExpense,
    });
  }
  const hasMonthlyData = months.some((m) => m.income > 0 || m.expense > 0);

  const catTotals: Record<string, number> = {};
  monthTx.filter((t) => t.type === "expense").forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const catData = Object.entries(catTotals)
    .map(([id, val]) => ({ id, name: catById(id).label, value: val, color: catById(id).color }))
    .sort((a, b) => b.value - a.value);

  const recent = transactions.slice(0, 6);

  // Text alternatives for the charts (the SVGs themselves are hidden from assistive tech).
  const sum = (rows: { income: number; expense: number }[], key: "income" | "expense") => rows.reduce((s, r) => s + r[key], 0);
  const weekLabel = `กราฟแท่งรายรับรายจ่าย 7 วันล่าสุด: รายรับรวม ${fmtMoney(sum(days, "income"))} บาท รายจ่ายรวม ${fmtMoney(sum(days, "expense"))} บาท`;
  const pieLabel = `สัดส่วนรายจ่ายเดือนนี้: ${catData.map((c) => `${c.name} ${expense > 0 ? Math.round((c.value / expense) * 100) : 0}%`).join(", ")}`;
  const monthLabel = `เปรียบเทียบรายรับรายจ่าย 6 เดือนล่าสุด: ${months.map((m) => `${m.label} สุทธิ ${m.net < 0 ? "ติดลบ " : ""}${fmtMoney(m.net)} บาท`).join(", ")}`;

  if (transactions.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <section
        aria-label="ยอดคงเหลือ"
        style={{ background: T.hero, color: "#fff", borderRadius: 24, padding: "26px 26px 22px", position: "relative", overflow: "hidden", boxShadow: "var(--shadow-lg)" }}
      >
        <div aria-hidden="true" style={{ position: "absolute", width: 260, height: 260, borderRadius: "50%", background: "rgba(255,255,255,0.08)", top: -110, right: -70 }} />
        <div aria-hidden="true" style={{ position: "absolute", width: 160, height: 160, borderRadius: "50%", background: "rgba(255,255,255,0.06)", bottom: -70, right: 120 }} />
        <div style={{ position: "relative" }}>
          <div style={{ fontSize: 13.5, fontWeight: 600, opacity: 0.85 }}>ยอดคงเหลือทั้งหมด</div>
          <div className="mono" style={{ fontSize: "clamp(34px, 7vw, 46px)", fontWeight: 800, letterSpacing: -1, marginTop: 2, lineHeight: 1.15 }}>
            {balanceAll < 0 ? "-" : ""}฿{fmtMoney(balanceAll)}
          </div>
          <div style={{ fontSize: 12.5, opacity: 0.75, marginTop: 4 }}>
            ประจำ{THAI_MONTHS_FULL[now.getMonth()]} {now.getFullYear() + 543}
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 10, marginTop: 18 }}>
            <HeroStat icon={ArrowDownLeft} label="รายรับเดือนนี้" value={`฿${fmtMoney(income)}`} />
            <HeroStat icon={ArrowUpRight} label="รายจ่ายเดือนนี้" value={`฿${fmtMoney(expense)}`} />
            {savingsRate !== null && (
              <HeroStat icon={PiggyBank} label="เก็บออมได้" value={`${savingsRate}%`} sub={savingsRate < 0 ? "ใช้เกินรายรับ" : "ของรายรับ"} />
            )}
          </div>
        </div>
      </section>

      <div className="sn-grid-2">
        <Card title="แนวโน้ม 7 วันล่าสุด">
          <ChartBox label={weekLabel} style={{ width: "100%", height: 200 }}>
            <ResponsiveContainer>
              <BarChart data={days} barGap={3}>
                <CartesianGrid vertical={false} stroke={T.paperLine} strokeDasharray="3 4" />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  formatter={(v: number, n: string) => [`฿${fmtMoney(v)}`, n === "income" ? "รายรับ" : "รายจ่าย"]}
                  labelFormatter={() => ""}
                  contentStyle={tooltipStyle}
                />
                <Bar dataKey="income" fill={T.income} radius={[6, 6, 0, 0]} maxBarSize={14} />
                <Bar dataKey="expense" fill={T.expense} radius={[6, 6, 0, 0]} maxBarSize={14} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
        </Card>

        <Card title="สัดส่วนรายจ่ายเดือนนี้">
          {catData.length === 0 ? (
            <div style={{ height: 200, display: "flex", alignItems: "center", justifyContent: "center", color: T.inkSoft, fontSize: 14 }}>ยังไม่มีรายจ่ายในเดือนนี้</div>
          ) : (
            <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
              <ChartBox label={pieLabel} style={{ width: 150, height: 150, flexShrink: 0, margin: "0 auto" }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie data={catData} dataKey="value" nameKey="name" innerRadius={46} outerRadius={72} paddingAngle={3} cornerRadius={4} stroke="none" rootTabIndex={-1}>
                      {catData.map((c, i) => (
                        <Cell key={i} fill={c.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => `฿${fmtMoney(v)}`} contentStyle={tooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
              </ChartBox>
              <div style={{ flex: 1, minWidth: 190, display: "flex", flexDirection: "column", gap: 10 }}>
                {catData.slice(0, 5).map((c) => (
                  <CategoryLegendRow key={c.id} cat={c} total={expense} />
                ))}
              </div>
            </div>
          )}
        </Card>
      </div>

      {hasMonthlyData && (
        <Card title="เปรียบเทียบรายรับ-รายจ่าย 6 เดือนล่าสุด">
          <ChartBox label={monthLabel} style={{ width: "100%", height: 230 }}>
            <ResponsiveContainer>
              <BarChart data={months} barGap={4} barCategoryGap="28%">
                <CartesianGrid vertical={false} stroke={T.paperLine} strokeDasharray="3 4" />
                <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip
                  cursor={{ fill: "var(--surface-2)" }}
                  formatter={(v: number, n: string) => [`฿${fmtMoney(v)}`, n === "income" ? "รายรับ" : n === "expense" ? "รายจ่าย" : "สุทธิ"]}
                  contentStyle={tooltipStyle}
                />
                <Legend
                  formatter={(v) => (v === "income" ? "รายรับ" : v === "expense" ? "รายจ่าย" : v)}
                  wrapperStyle={{ fontSize: 12.5, color: "var(--muted)" }}
                  iconType="circle"
                  iconSize={8}
                />
                <Bar dataKey="income" name="income" fill={T.income} radius={[6, 6, 0, 0]} maxBarSize={24} />
                <Bar dataKey="expense" name="expense" fill={T.expense} radius={[6, 6, 0, 0]} maxBarSize={24} />
              </BarChart>
            </ResponsiveContainer>
          </ChartBox>
          <div
            className="sn-scroll"
            role="region"
            aria-label="ยอดสุทธิรายเดือน (เลื่อนดูได้)"
            tabIndex={0}
            style={{ display: "flex", gap: 8, marginTop: 12, overflowX: "auto", paddingBottom: 2 }}
          >
            {months.map((m) => (
              <div key={m.label} style={{ flex: "1 0 auto", minWidth: 92, textAlign: "center", padding: "8px 6px", borderRadius: 12, background: T.paperDim }}>
                <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600 }}>{m.label}</div>
                <div className="mono" style={{ fontSize: 13, fontWeight: 700, color: m.net >= 0 ? T.income : T.expense }}>
                  {m.net >= 0 ? "+" : "-"}฿{fmtMoney(m.net)}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card title="รายการล่าสุด" action={<button onClick={onSeeAll} style={ghostBtn}>ดูทั้งหมด</button>}>
        <div>
          {recent.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 && <Divider />}
              <TxRow tx={t} onClick={() => onSeeDay(t.date)} />
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

/** A chart with a text alternative: the drawing is aria-hidden, the wrapper is the labelled image. */
function ChartBox({ label, style, children }: { label: string; style: React.CSSProperties; children: React.ReactNode }) {
  return (
    <div role="img" aria-label={label} style={style}>
      <div aria-hidden="true" style={{ width: "100%", height: "100%" }}>
        {children}
      </div>
    </div>
  );
}

function HeroStat({ icon: Icon, label, value, sub }: { icon: typeof ArrowUpRight; label: string; value: string; sub?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", borderRadius: 16, background: "rgba(255,255,255,0.14)", backdropFilter: "blur(6px)", WebkitBackdropFilter: "blur(6px)" }}>
      <div style={{ width: 34, height: 34, borderRadius: 11, background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={18} />
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 12, opacity: 0.85 }}>{label}</div>
        <div className="mono" style={{ fontSize: 16, fontWeight: 700, overflowWrap: "anywhere" }}>
          {value}
          {sub && <span style={{ fontSize: 11, fontWeight: 500, opacity: 0.8, marginLeft: 6 }}>{sub}</span>}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="sn-card" style={{ borderStyle: "dashed", padding: "56px 24px", textAlign: "center", boxShadow: "none" }}>
      <div style={{ width: 64, height: 64, margin: "0 auto 18px", borderRadius: 20, background: T.primarySoft, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Wallet size={28} color="var(--primary)" />
      </div>
      <div style={{ fontWeight: 800, fontSize: 19 }}>เริ่มต้นสมุดเงินของคุณ</div>
      <p style={{ fontSize: 14, color: T.inkSoft, margin: "6px auto 22px", maxWidth: 340 }}>บันทึกรายรับรายจ่ายรายการแรก แล้วภาพรวมการเงินและกราฟจะปรากฏที่นี่</p>
      <button onClick={onAdd} style={primaryBtn}>
        <Plus size={16} strokeWidth={2.6} /> บันทึกรายการแรก
      </button>
    </div>
  );
}

function CategoryLegendRow({ cat, total }: { cat: { id: string; name: string; value: number; color: string }; total: number }) {
  const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 13.5 }}>
      <CategoryIcon id={cat.id} size={28} />
      <span style={{ flex: 1, fontWeight: 500 }}>{cat.name}</span>
      <span className="mono" style={{ color: T.inkSoft, fontSize: 12.5 }}>{pct}%</span>
      <span className="mono" style={{ fontWeight: 700, minWidth: 76, textAlign: "right" }}>฿{fmtMoney(cat.value)}</span>
    </div>
  );
}
