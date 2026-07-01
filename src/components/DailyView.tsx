import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { T, fmtDateLong, todayISO, addDays, parseISO, isoDate } from "../theme";
import { Transaction } from "../types";
import { Card, MiniStat, TearDivider, TxRow, ghostBtn, iconBtn } from "./shared";

export function DailyView({
  transactions,
  selectedDate,
  setSelectedDate,
  onDelete,
}: {
  transactions: Transaction[];
  selectedDate: string;
  setSelectedDate: (iso: string) => void;
  onDelete: (id: string) => void;
}) {
  const dayTx = transactions.filter((t) => t.date === selectedDate).sort((a, b) => b.createdAt - a.createdAt);
  const income = dayTx.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = dayTx.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  const shift = (n: number) => {
    const d = addDays(parseISO(selectedDate), n);
    setSelectedDate(isoDate(d));
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", border: `1px solid ${T.paperLine}`, borderRadius: 12, padding: "10px 12px" }}>
        <button onClick={() => shift(-1)} style={iconBtn}>
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>{fmtDateLong(selectedDate)}</div>
          {selectedDate !== todayISO() && (
            <button onClick={() => setSelectedDate(todayISO())} style={{ ...ghostBtn, marginTop: 2, fontSize: 11 }}>
              กลับไปวันนี้
            </button>
          )}
        </div>
        <button onClick={() => shift(1)} style={iconBtn}>
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10 }}>
        <MiniStat label="รายรับ" value={income} color={T.income} />
        <MiniStat label="รายจ่าย" value={expense} color={T.expense} />
        <MiniStat label="สุทธิ" value={income - expense} color={income - expense >= 0 ? T.ink : T.expense} />
      </div>

      <Card title={`รายการ (${dayTx.length})`}>
        {dayTx.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", color: T.inkSoft, fontSize: 13 }}>ไม่มีรายการในวันนี้</div>
        ) : (
          dayTx.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 && <TearDivider />}
              <TxRow tx={t} onDelete={onDelete} />
            </React.Fragment>
          ))
        )}
      </Card>
    </div>
  );
}
