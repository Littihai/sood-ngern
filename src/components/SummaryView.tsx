import React, { useState } from "react";
import { ChevronLeft, ChevronRight, Minus } from "lucide-react";
import {
  T, catById, fmtMoney, fmtDateShort, isoDate, parseISO, addDays, startOfWeekMon,
  THAI_MONTHS_FULL, THAI_DOW_FULL, EXPENSE_CATS, INCOME_CATS,
} from "../theme";
import { Transaction } from "../types";
import { Card, MiniStat, TearDivider, iconBtn } from "./shared";

type Mode = "week" | "month";

interface CatRow {
  id: string;
  name: string;
  value: number;
  color: string;
}

export function SummaryView({ transactions, onSeeDay }: { transactions: Transaction[]; onSeeDay: (iso: string) => void }) {
  const [mode, setMode] = useState<Mode>("week");
  const [anchor, setAnchor] = useState(new Date());
  const [selectedExpenseCats, setSelectedExpenseCats] = useState<string[]>([]);
  const [selectedIncomeCats, setSelectedIncomeCats] = useState<string[]>([]);

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

  const buildCatData = (type: "income" | "expense"): CatRow[] => {
    const totals: Record<string, number> = {};
    rangeTx.filter((t) => t.type === type).forEach((t) => {
      totals[t.category] = (totals[t.category] || 0) + t.amount;
    });
    return Object.entries(totals)
      .map(([id, val]) => ({ id, name: catById(id).label, value: val, color: catById(id).color }))
      .sort((a, b) => b.value - a.value);
  };

  const expenseCatData = buildCatData("expense");
  const incomeCatData = buildCatData("income");

  const sumByCategories = (type: "income" | "expense", categoryIds: string[]) =>
    rangeTx
      .filter((t) => t.type === type && categoryIds.includes(t.category))
      .reduce((s, t) => s + t.amount, 0);

  const selectedExpenseTotal = sumByCategories("expense", selectedExpenseCats);
  const selectedIncomeTotal = sumByCategories("income", selectedIncomeCats);
  const hasSelection = selectedExpenseCats.length > 0 || selectedIncomeCats.length > 0;
  const diff = selectedIncomeTotal - selectedExpenseTotal;

  const toggleCat = (list: string[], setList: (v: string[]) => void, id: string) => {
    setList(list.includes(id) ? list.filter((c) => c !== id) : [...list, id]);
  };

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

      <Card title="เปรียบเทียบหมวดหมู่ที่เลือก">
        <div style={{ fontSize: 12, color: T.inkSoft, marginBottom: 12 }}>
          เลือกหมวดหมู่รายจ่ายและรายรับที่ต้องการ (เลือกได้มากกว่า 1 รายการในแต่ละฝั่ง) ระบบจะนำผลรวมรายรับที่เลือกลบด้วยผลรวมรายจ่ายที่เลือกให้อัตโนมัติ
        </div>

        <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, marginBottom: 6 }}>หมวดหมู่รายจ่าย</div>
        <CategoryPicker
          cats={EXPENSE_CATS}
          selected={selectedExpenseCats}
          onToggle={(id) => toggleCat(selectedExpenseCats, setSelectedExpenseCats, id)}
        />

        <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft, margin: "14px 0 6px" }}>หมวดหมู่รายรับ</div>
        <CategoryPicker
          cats={INCOME_CATS}
          selected={selectedIncomeCats}
          onToggle={(id) => toggleCat(selectedIncomeCats, setSelectedIncomeCats, id)}
        />

        <div style={{ display: "grid", gridTemplateColumns: "1fr auto 1fr auto 1fr", gap: 8, alignItems: "center", marginTop: 16 }}>
          <ResultBox label="รายรับที่เลือก" value={selectedIncomeTotal} color={T.income} />
          <Minus size={16} color={T.inkSoft} style={{ justifySelf: "center" }} />
          <ResultBox label="รายจ่ายที่เลือก" value={selectedExpenseTotal} color={T.expense} />
          <div style={{ textAlign: "center", color: T.inkSoft, fontSize: 18, fontWeight: 700 }}>=</div>
          <ResultBox label="ผลต่าง" value={diff} color={diff >= 0 ? T.income : T.expense} signed />
        </div>

        {!hasSelection && (
          <div style={{ textAlign: "center", color: T.inkSoft, fontSize: 12, marginTop: 10 }}>
            ยังไม่ได้เลือกหมวดหมู่ — ผลลัพธ์ด้านบนจะเป็น 0 จนกว่าจะเลือกอย่างน้อย 1 หมวดหมู่
          </div>
        )}
      </Card>

      <Card title="แยกตามหมวดหมู่รายจ่าย">
        <CategoryBreakdown data={expenseCatData} total={expense} emptyLabel="ไม่มีรายจ่ายในช่วงนี้" />
      </Card>

      <Card title="แยกตามหมวดหมู่รายรับ">
        <CategoryBreakdown data={incomeCatData} total={income} emptyLabel="ไม่มีรายรับในช่วงนี้" />
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

function CategoryPicker({
  cats,
  selected,
  onToggle,
}: {
  cats: typeof EXPENSE_CATS;
  selected: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      {cats.map((c) => {
        const Icon = c.icon;
        const active = selected.includes(c.id);
        return (
          <button
            key={c.id}
            onClick={() => onToggle(c.id)}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 12px", borderRadius: 999,
              border: `1px solid ${active ? c.color : T.paperLine}`, background: active ? c.color + "1c" : T.paper,
              fontSize: 12.5, fontWeight: active ? 600 : 500, color: active ? c.color : T.inkSoft,
            }}
          >
            <Icon size={13} color={active ? c.color : T.inkSoft} />
            {c.label}
          </button>
        );
      })}
    </div>
  );
}

function ResultBox({ label, value, color, signed }: { label: string; value: number; color: string; signed?: boolean }) {
  return (
    <div style={{ border: `1px solid ${T.paperLine}`, borderRadius: 10, padding: "8px 10px", textAlign: "center", background: T.paperDim }}>
      <div style={{ fontSize: 10.5, color: T.inkSoft, marginBottom: 2 }}>{label}</div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 700, color }}>
        {signed ? (value >= 0 ? "+" : "-") : ""}฿{fmtMoney(value)}
      </div>
    </div>
  );
}

function CategoryBreakdown({ data, total, emptyLabel }: { data: CatRow[]; total: number; emptyLabel: string }) {
  const maxCat = data.length > 0 ? data[0].value : 0;

  if (data.length === 0) {
    return <div style={{ textAlign: "center", padding: "16px 0", color: T.inkSoft, fontSize: 13 }}>{emptyLabel}</div>;
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {data.map((c) => {
        const Icon = catById(c.id).icon;
        const pct = total > 0 ? Math.round((c.value / total) * 100) : 0;
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
  );
}