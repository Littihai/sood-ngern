import React, { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T, catById, fmtMoney, fmtDateShort, isoDate, parseISO, addDays, startOfWeekMon, THAI_MONTHS_FULL, THAI_DOW_FULL } from "../theme";
import { Transaction } from "../types";
import { Card, MiniStat, TearDivider, iconBtn } from "./shared";

type Mode = "week" | "month";

export function SummaryView({ transactions, onSeeDay }: { transactions: Transaction[]; onSeeDay: (iso: string) => void }) {
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(new Date());

  let rangeStart: Date, rangeEnd: Date, rangeLabel: string;
  if (mode === "week") {
    rangeStart = startOfWeekMon(anchor);
    rangeEnd = addDays(rangeStart, 6);
    rangeLabel = `${fmtDateShort(isoDate(rangeStart))} – ${fmtDateShort(isoDate(rangeEnd))}`;
  } else {
    rangeStart = new Date(anchor.getFullYear(), anchor.getMonth(), 1);
    rangeEnd = new Date(anchor.getFullYear(), anchor.getMonth() + 1, 0);
    rangeLabel = `${THAI_MONTHS_FULL[anchor.getMonth()]} ${anchor.getFullYear() + 543}`;
  }

  const startISO = isoDate(rangeStart);
  const endISO = isoDate(rangeEnd);
  const rangeTx = transactions.filter((t) => t.date >= startISO && t.date <= endISO);

  const income = rangeTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = rangeTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const catTotals: Record<string, number> = {};
  rangeTx.filter((t) => t.type === "expense").forEach((t) => {
    catTotals[t.category] = (catTotals[t.category] || 0) + t.amount;
  });
  const catData = Object.entries(catTotals)
    .map(([id, val]) => ({ id, name: catById(id).label, value: val, color: catById(id).color }))
    .sort((a, b) => b.value - a.value);
  const maxCat = catData.length > 0 ? catData[0].value : 0;

  const byDay: Record<string, { income: number; expense: number }> = {};
  rangeTx.forEach((t) => {
    byDay[t.date] = byDay[t.date] || { income: 0, expense: 0 };
    byDay[t.date][t.type] += t.amount;
  });
  const dayList = Object.entries(byDay).sort((a, b) => (a[0] < b[0] ? 1 : -1));

  const shift = (dir: number) => {
    if (mode === "week") setAnchor(addDays(anchor, dir * 7));
    else setAnchor(new Date(anchor.getFullYear(), anchor.getMonth() + dir, 1));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", background: T.paperDim, borderRadius: 10, padding: 4, width: "fit-content" }}>
        {(
          [
            { id: "week", label: "รายสัปดาห์" },
            { id: "month", label: "รายเดือน" },
          ] as { id: Mode; label: string }[]
        ).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setMode(opt.id)}
            style={{ padding: "7px 16px", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 13, background: mode === opt.id ? T.ink : "transparent", color: mode === opt.id ? T.paper : T.inkSoft }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${T.paperLine}`, borderRadius: 12, padding: "10px 12px" }}>
        <button onClick={() => shift(-1)} style={iconBtn}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ fontWeight: 600, fontSize: 14 }}>{rangeLabel}</div>
        <button onClick={() => shift(1)} style={iconBtn}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <MiniStat label="รายรับ" value={income} color={T.income} />
        <MiniStat label="รายจ่าย" value={expense} color={T.expense} />
        <MiniStat label="สุทธิ" value={income - expense} color={income - expense >= 0 ? T.ink : T.expense} />
      </div>

      <Card title="แยกตามหมวดหมู่">
        {catData.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: T.inkSoft, fontSize: 13 }}>ไม่มีรายจ่ายในช่วงนี้</div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {catData.map((c) => {
              const Icon = catById(c.id).icon;
              const pct = expense > 0 ? Math.round((c.value / expense) * 100) : 0;
              const barPct = maxCat > 0 ? (c.value / maxCat) * 100 : 0;
              return (
                <div key={c.id}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, marginBottom: 4 }}>
                    <Icon size={14} color={c.color} />
                    <span style={{ flex: 1 }}>{c.name}</span>
                    <span style={{ color: T.inkSoft, fontSize: 11 }}>{pct}%</span>
                    <span className="mono" style={{ fontWeight: 600, minWidth: 70, textAlign: "right" }}>฿{fmtMoney(c.value)}</span>
                  </div>
                  <div style={{ height: 6, background: T.paperDim, borderRadius: 4 }}>
                    <div style={{ height: "100%", width: `${barPct}%`, background: c.color, borderRadius: 4 }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card title="รายวันในช่วงนี้">
        {dayList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "16px 0", color: T.inkSoft, fontSize: 13 }}>ไม่มีรายการ</div>
        ) : (
          dayList.map(([iso, sums], i) => (
            <React.Fragment key={iso}>
              {i > 0 && <TearDivider />}
              <button onClick={() => onSeeDay(iso)} style={{ display: "flex", alignItems: "center", width: "100%", background: "transparent", border: "none", padding: "6px 0", textAlign: "left" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 500 }}>{fmtDateShort(iso)}</div>
                  <div style={{ fontSize: 11, color: T.inkSoft }}>{THAI_DOW_FULL[parseISO(iso).getDay()]}</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  {sums.income > 0 && <div className="mono" style={{ fontSize: 12, color: T.income }}>+฿{fmtMoney(sums.income)}</div>}
                  {sums.expense > 0 && <div className="mono" style={{ fontSize: 12, color: T.expense }}>-฿{fmtMoney(sums.expense)}</div>}
                </div>
              </button>
            </React.Fragment>
          ))
        )}
      </Card>
    </div>
  );
}
