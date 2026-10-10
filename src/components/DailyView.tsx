import React from "react";
import { ChevronLeft, ChevronRight, ReceiptText } from "lucide-react";
import { T, fmtDateLong, todayISO, addDays, parseISO, isoDate } from "../theme";
import { Transaction } from "../types";
import { Card, Divider, MiniStat, TxRow, ghostBtn, iconBtn } from "./shared";

export function DailyView({
  transactions,
  selectedDate,
  setSelectedDate,
  onDelete,
}: {
  transactions: Transaction[];
  selectedDate: string;
  setSelectedDate: (iso: string) => void;
  onDelete?: (id: string) => void | Promise<void>;
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
      <div className="sn-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px" }}>
        <button onClick={() => shift(-1)} style={iconBtn} aria-label="วันก่อนหน้า">
          <ChevronLeft size={18} />
        </button>
        <div style={{ textAlign: "center" }}>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{fmtDateLong(selectedDate)}</div>
          {selectedDate !== todayISO() && (
            <button onClick={() => setSelectedDate(todayISO())} style={{ ...ghostBtn, fontSize: 12.5 }}>
              กลับไปวันนี้
            </button>
          )}
        </div>
        <button onClick={() => shift(1)} style={iconBtn} aria-label="วันถัดไป">
          <ChevronRight size={18} />
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
        <MiniStat label="รายรับ" value={income} color={T.income} />
        <MiniStat label="รายจ่าย" value={expense} color={T.expense} />
        <MiniStat label="สุทธิ" value={income - expense} color={income - expense >= 0 ? T.ink : T.expense} />
      </div>

      <Card title={`รายการ (${dayTx.length})`}>
        {dayTx.length === 0 ? (
          <div style={{ textAlign: "center", padding: "30px 0 22px", color: T.inkSoft, fontSize: 14 }}>
            <ReceiptText size={34} strokeWidth={1.5} style={{ marginBottom: 8, opacity: 0.6 }} />
            <div>ไม่มีรายการในวันนี้</div>
          </div>
        ) : (
          dayTx.map((t, i) => (
            <React.Fragment key={t.id}>
              {i > 0 && <Divider />}
              <TxRow tx={t} onDelete={onDelete} />
            </React.Fragment>
          ))
        )}
      </Card>
    </div>
  );
}
