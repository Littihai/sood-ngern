import React from "react";
import { Wallet, Plus, TrendingUp, TrendingDown } from "lucide-react";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";
import { T, catById, fmtMoney, isoDate, parseISO, addDays, THAI_DOW } from "../theme";
import { Transaction } from "../types";
import { Card, TearDivider, TxRow, ghostBtn, primaryBtn } from "./shared";

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

  const catTotals: Record<string, number> = {};
  monthTx.filter((t) => t.type === "expense").forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const catData = Object.entries(catTotals)
    .map(([id, val]) => ({ id, name: catById(id).label, value: val, color: catById(id).color }))
    .sort((a, b) => b.value - a.value);

  const recent = transactions.slice(0, 6);

  if (transactions.length === 0) return <EmptyState onAdd={onAdd} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div className="ledger-lines" style={{ border: `1px solid ${T.paperLine}`, borderRadius: 14, padding: "22px 22px 18px", background: T.paper }}>
        <div style={{ fontSize: 11, letterSpacing: 1.2, color: T.inkSoft, fontWeight: 600, textTransform: "uppercase" }}>ยอดคงเหลือทั้งหมด</div>
        <div className="mono" style={{ fontSize: 38, fontWeight: 600, marginTop: 4, color: balanceAll < 0 ? T.expense : T.ink }}>
          ฿{fmtMoney(balanceAll)}
        </div>
        <div style={{ display: "flex", gap: 22, marginTop: 14, flexWrap: "wrap" }}>
          <StatChip icon={TrendingUp} color={T.income} bg={T.incomeBg} label="รายรับเดือนนี้" value={income} />
          <StatChip icon={TrendingDown} color={T.expense} bg={T.expenseBg} label="รายจ่ายเดือนนี้" value={expense} />
        </div>
      </div>

      <Card title="แนวโน้ม 7 วันล่าสุด">
        <div style={{ width: "100%", height: 180 }}>
          <ResponsiveContainer>
            <BarChart data={days} barGap={2}>
              <CartesianGrid vertical={false} stroke={T.paperLine} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: T.inkSoft }} axisLine={{ stroke: T.paperLine }} tickLine={false} />
              <YAxis hide />
              <Tooltip
                formatter={(v: number, n: string) => [`฿${fmtMoney(v)}`, n === "income" ? "รายรับ" : "รายจ่าย"]}
                labelFormatter={() => ""}
                contentStyle={{ fontSize: 12, borderRadius: 8, border: `1px solid ${T.paperLine}`, fontFamily: "IBM Plex Sans Thai" }}
              />
              <Bar dataKey="income" fill={T.income} radius={[3, 3, 0, 0]} maxBarSize={14} />
              <Bar dataKey="expense" fill={T.expense} radius={[3, 3, 0, 0]} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {catData.length > 0 && (
        <Card title="สัดส่วนรายจ่ายเดือนนี้">
          <div style={{ display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ width: 140, height: 140, flexShrink: 0 }}>
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={catData} dataKey="value" nameKey="name" innerRadius={38} outerRadius={62} paddingAngle={2}>
                    {catData.map((c, i) => (
                      <Cell key={i} fill={c.color} stroke={T.paper} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `฿${fmtMoney(v)}`} contentStyle={{ fontSize: 12, borderRadius: 8, fontFamily: "IBM Plex Sans Thai" }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ flex: 1, minWidth: 180, display: "flex", flexDirection: "column", gap: 8 }}>
              {catData.map((c) => (
                <CategoryLegendRow key={c.id} cat={c} total={expense} />
              ))}
            </div>
          </div>
        </Card>
      )}

      <Card title="รายการล่าสุด" action={<button onClick={onSeeAll} style={ghostBtn}>ดูทั้งหมด</button>}>
        <div>
          {recent.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 && <TearDivider />}
              <TxRow tx={t} onClick={() => onSeeDay(t.date)} />
            </React.Fragment>
          ))}
        </div>
      </Card>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={{ border: `1px dashed ${T.paperLine}`, borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
      <div style={{ width: 52, height: 52, margin: "0 auto 16px", borderRadius: "50%", background: T.paperDim, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Wallet size={24} color={T.inkSoft} />
      </div>
      <div style={{ fontWeight: 600, fontSize: 16 }}>ยังไม่มีรายการ</div>
      <p style={{ fontSize: 13, color: T.inkSoft, margin: "6px 0 18px" }}>เริ่มบันทึกรายรับรายจ่ายวันนี้ เพื่อดูภาพรวมการเงินของคุณ</p>
      <button onClick={onAdd} style={primaryBtn}>
        <Plus size={15} /> บันทึกรายการแรก
      </button>
    </div>
  );
}

function StatChip({ icon: Icon, color, bg, label, value }: { icon: typeof TrendingUp; color: string; bg: string; label: string; value: number }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <div style={{ width: 30, height: 30, borderRadius: 8, background: bg, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <Icon size={15} color={color} />
      </div>
      <div>
        <div style={{ fontSize: 11, color: T.inkSoft }}>{label}</div>
        <div className="mono" style={{ fontSize: 15, fontWeight: 600, color }}>฿{fmtMoney(value)}</div>
      </div>
    </div>
  );
}

function CategoryLegendRow({ cat, total }: { cat: { id: string; name: string; value: number; color: string }; total: number }) {
  const pct = total > 0 ? Math.round((cat.value / total) * 100) : 0;
  const Icon = catById(cat.id).icon;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13 }}>
      <div style={{ width: 22, height: 22, borderRadius: 6, background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Icon size={12} color={cat.color} />
      </div>
      <span style={{ flexShrink: 0 }}>{cat.name}</span>
      <span style={{ flex: 1, borderBottom: `1px dotted ${T.paperLine}`, transform: "translateY(-3px)" }} />
      <span className="mono" style={{ color: T.inkSoft, fontSize: 12 }}>{pct}%</span>
      <span className="mono" style={{ fontWeight: 600, minWidth: 74, textAlign: "right" }}>฿{fmtMoney(cat.value)}</span>
    </div>
  );
}
