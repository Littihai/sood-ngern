import React, { useEffect, useState } from "react";
import { Check } from "lucide-react";
import { T, catsForType, todayISO, EXPENSE_CATS } from "../theme";
import { NewTransaction, TransactionType } from "../types";
import { Segmented, inputStyle, primaryBtn } from "./shared";

const QUICK_AMOUNTS = [50, 100, 500, 1000];

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

  const value = parseFloat(amount);
  const canSave = !!value && value > 0;

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSave) return;
    onSubmit({ type, amount: value, category, note: note.trim(), date });
    setAmount("");
    setNote("");
  };

  const accent = type === "income" ? T.income : T.expense;

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16, maxWidth: 640 }}>
      <Segmented
        ariaLabel="ประเภทรายการ"
        fill
        value={type}
        onChange={setType}
        options={[
          { id: "expense", label: "รายจ่าย", color: T.expense },
          { id: "income", label: "รายรับ", color: T.income },
        ]}
      />

      <div className="sn-card" style={{ padding: "26px 20px 20px", textAlign: "center" }}>
        <label htmlFor="amount" style={{ fontSize: 13, color: T.inkSoft, fontWeight: 600 }}>
          จำนวนเงิน (บาท)
        </label>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 6 }}>
          <span className="mono" style={{ fontSize: 30, color: accent, fontWeight: 700 }}>฿</span>
          <input
            id="amount"
            inputMode="decimal"
            autoComplete="off"
            value={amount}
            onChange={(e) => {
              const v = e.target.value;
              if (/^\d*\.?\d{0,2}$/.test(v)) setAmount(v);
            }}
            placeholder="0.00"
            className="mono"
            style={{ border: "none", outline: "none", background: "transparent", fontSize: 44, fontWeight: 800, color: T.ink, width: `${Math.max(amount.length, 4) + 0.6}ch`, maxWidth: "75%", textAlign: "center", letterSpacing: -1, boxShadow: "none" }}
          />
        </div>
        <div style={{ display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap", marginTop: 14 }}>
          {QUICK_AMOUNTS.map((q) => (
            <button
              type="button"
              key={q}
              onClick={() => setAmount(String(q))}
              style={{ padding: "7px 14px", borderRadius: 999, border: `1px solid ${T.paperLine}`, background: T.paperDim, color: T.ink, fontSize: 13, fontWeight: 600 }}
            >
              ฿{q.toLocaleString("th-TH")}
            </button>
          ))}
        </div>
      </div>

      <div className="sn-card" style={{ padding: "16px 18px" }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: T.inkSoft, marginBottom: 10 }}>หมวดหมู่</div>
        <div role="radiogroup" aria-label="หมวดหมู่" style={{ display: "grid", gridTemplateColumns: "repeat(4, minmax(0, 1fr))", gap: 8 }}>
          {cats.map((c) => {
            const Icon = c.icon;
            const active = category === c.id;
            return (
              <button
                type="button"
                role="radio"
                aria-checked={active}
                key={c.id}
                onClick={() => setCategory(c.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 7, padding: "12px 4px", minHeight: 76,
                  borderRadius: 14, border: `2px solid ${active ? c.color : "transparent"}`, background: active ? c.color + "1f" : T.paperDim,
                }}
              >
                <Icon size={21} color={c.color} />
                <span style={{ fontSize: 12.5, color: T.ink, fontWeight: active ? 700 : 500, textAlign: "center" }}>{c.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="sn-card" style={{ padding: "16px 18px", display: "flex", gap: 14, flexWrap: "wrap" }}>
        <label style={{ flex: "1 1 160px", fontSize: 13, fontWeight: 600, color: T.inkSoft }}>
          วันที่
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={inputStyle} />
        </label>
        <label style={{ flex: "2 1 220px", fontSize: 13, fontWeight: 600, color: T.inkSoft }}>
          รายละเอียด (ไม่บังคับ)
          <input type="text" value={note} onChange={(e) => setNote(e.target.value)} placeholder="เช่น กาแฟตอนเช้า" maxLength={500} style={inputStyle} />
        </label>
      </div>

      <button
        type="submit"
        disabled={!canSave}
        style={{ ...primaryBtn, justifyContent: "center", fontSize: 16, padding: "15px 0", borderRadius: 16, opacity: canSave ? 1 : 0.45, boxShadow: canSave ? T.shadow : "none" }}
      >
        {savedFlash ? (
          <>
            <Check size={18} strokeWidth={3} /> บันทึกแล้ว
          </>
        ) : (
          "บันทึกรายการ"
        )}
      </button>
    </form>
  );
}
