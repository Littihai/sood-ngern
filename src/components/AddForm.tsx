import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { T, catsForType, todayISO, EXPENSE_CATS } from "../theme";
import { NewTransaction, TransactionType } from "../types";
import { inputStyle, primaryBtn } from "./shared";

export function AddForm({ onSubmit, savedFlash }: { onSubmit: (tx: NewTransaction) => void; savedFlash: boolean }) {
  const [type, setType] = useState<TransactionType>("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(EXPENSE_CATS[0].id);
  const [note, setNote] = useState("");
  const [date, setDate] = useState(todayISO());

  const cats = catsForType(type);

  useEffect(() => {
    setCategory(cats[0].id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [type]);

  const handleSubmit = () => {
    const val = parseFloat(amount);
    if (!val || val <= 0) return;
    onSubmit({ type, amount: val, category, note: note.trim(), date });
    setAmount("");
    setNote("");
  };

  const accent = type === "income" ? T.income : T.expense;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "flex", background: T.paperDim, borderRadius: 10, padding: 4 }}>
        {(
          [
            { id: "expense", label: "รายจ่าย" },
            { id: "income", label: "รายรับ" },
          ] as { id: TransactionType; label: string }[]
        ).map((opt) => (
          <button
            key={opt.id}
            onClick={() => setType(opt.id)}
            style={{
              flex: 1, padding: "9px 0", borderRadius: 8, border: "none", fontWeight: 600, fontSize: 14,
              background: type === opt.id ? (opt.id === "income" ? T.income : T.expense) : "transparent",
              color: type === opt.id ? T.paper : T.inkSoft,
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div style={{ border: `1px solid ${T.paperLine}`, borderRadius: 14, padding: "22px 18px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: T.inkSoft, fontWeight: 600, letterSpacing: 1 }}>จำนวนเงิน (บาท)</div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 6 }}>
          <span className="mono" style={{ fontSize: 26, color: accent, fontWeight: 600 }}>฿</span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
            }}
            placeholder="0.00"
            className="mono"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 36, fontWeight: 600, color: T.ink, width: 200, textAlign: "center" }}
          />
        </div>
      </div>

      <div>
        <FieldLabel>หมวดหมู่</FieldLabel>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginTop: 8 }}>
          {cats.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 5, padding: "10px 4px",
                  borderRadius: 10, border: `1px solid ${active ? c.color : T.paperLine}`, background: active ? c.color + "1c" : T.paper,
                }}
              >
                <Icon size={17} color={active ? c.color : T.inkSoft} />
                <span style={{ fontSize: 11, color: active ? c.color : T.inkSoft, fontWeight: active ? 600 : 500, textAlign: "center" }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140 }}>
          <FieldLabel>วันที่</FieldLabel>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </div>
        <div style={{ flex: 2, minWidth: 180 }}>
          <FieldLabel>รายละเอียด (ไม่บังคับ)</FieldLabel>
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น กาแฟตอนเช้า" style={inputStyle} />
        </div>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!amount || parseFloat(amount) <= 0}
        style={{ ...primaryBtn, justifyContent: "center", background: accent, opacity: !amount || parseFloat(amount) <= 0 ? 0.5 : 1, fontSize: 15, padding: "13px 0" }}
      >
        {savedFlash ? (
          <>
            <Check size={16} /> บันทึกแล้ว
          </>
        ) : (
          "บันทึกรายการ"
        )}
      </button>
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: 12, fontWeight: 600, color: T.inkSoft }}>{children}</div>;
}
