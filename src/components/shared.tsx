import React, { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { T, catById, fmtMoney, fmtDateShort } from "../theme";
import { Transaction } from "../types";

/* ---------------------------------- layout ---------------------------------- */

export function Divider() {
  return <div role="separator" style={{ height: 1, background: T.paperLine, margin: "4px 0" }} />;
}

export function Card({ title, action, children }: { title?: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="sn-card" style={{ padding: "18px 20px" }}>
      {(title || action) && (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14, gap: 12 }}>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: T.ink }}>{title}</h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function MiniStat({ label, value, color, tone }: { label: string; value: number; color: string; tone?: string }) {
  return (
    <div className="sn-card" style={{ padding: "12px 14px", background: tone ?? T.paper }}>
      <div style={{ fontSize: 12, color: T.inkSoft, fontWeight: 500 }}>{label}</div>
      <div className="mono" style={{ fontSize: 17, fontWeight: 700, color, marginTop: 2, overflowWrap: "anywhere" }}>
        {value < 0 ? "-" : ""}฿{fmtMoney(value)}
      </div>
    </div>
  );
}

/** Pill-shaped tab switcher (e.g. expense / income, week / month). */
export function Segmented<V extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  fill,
}: {
  options: { id: V; label: string; color?: string }[];
  value: V;
  onChange: (v: V) => void;
  ariaLabel: string;
  fill?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label={ariaLabel}
      style={{ display: "flex", background: T.paperDim, border: `1px solid ${T.paperLine}`, borderRadius: 14, padding: 4, width: fill ? "100%" : "fit-content", gap: 2 }}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <button
            key={opt.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.id)}
            style={{
              flex: fill ? 1 : undefined, padding: "8px 18px", borderRadius: 10, border: "none", fontWeight: 600, fontSize: 14,
              background: active ? T.paper : "transparent", color: active ? opt.color ?? T.ink : T.inkSoft,
              boxShadow: active ? T.shadow : "none",
            }}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function CategoryIcon({ id, size = 40 }: { id: string; size?: number }) {
  const cat = catById(id);
  const Icon = cat.icon;
  return (
    <div
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.32), background: cat.color + "22", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
    >
      <Icon size={Math.round(size * 0.46)} color={cat.color} />
    </div>
  );
}

/* ------------------------------- transaction row ------------------------------- */

export function TxRow({
  tx,
  onDelete,
  onClick,
}: {
  tx: Transaction;
  onDelete?: (id: string) => void;
  onClick?: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const cat = catById(tx.category);
  const isIncome = tx.type === "income";
  const title = tx.note ? tx.note : cat.label;

  return (
    <div
      className={`sn-row${onClick ? " sn-row-click" : ""}`}
      onClick={onClick}
      style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 8px", margin: "0 -8px", borderRadius: 12 }}
    >
      <CategoryIcon id={tx.category} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14.5, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{title}</div>
        <div style={{ fontSize: 12, color: T.inkSoft, display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ whiteSpace: "nowrap" }}>
            {cat.label} · {fmtDateShort(tx.date)}
          </span>
          <span aria-hidden="true">·</span>
          <Avatar name={tx.createdByName || "Unknown"} photoURL={tx.createdByPhotoURL} size={14} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.createdByName || "Unknown"}</span>
        </div>
      </div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: isIncome ? T.income : T.ink, whiteSpace: "nowrap" }}>
        {isIncome ? "+" : "-"}฿{fmtMoney(tx.amount)}
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          style={{ background: "transparent", border: "none", color: T.inkSoft, padding: 8, borderRadius: 8, display: "flex" }}
          aria-label={`ลบรายการ ${title}`}
        >
          <Trash2 size={16} />
        </button>
      )}

      {showConfirm && (
        <ConfirmDialog
          title="ยืนยันการลบรายการ"
          message={`คุณต้องการลบรายการ "${title}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้`}
          confirmLabel="ลบรายการ"
          onCancel={() => setShowConfirm(false)}
          onConfirm={() => {
            onDelete?.(tx.id);
            setShowConfirm(false);
          }}
        />
      )}
    </div>
  );
}

export function Avatar({ name, photoURL, size = 28 }: { name: string; photoURL?: string | null; size?: number }) {
  if (photoURL) {
    return <img src={photoURL} alt="" style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  }
  return (
    <span
      aria-hidden="true"
      style={{ width: size, height: size, borderRadius: "50%", background: T.primarySoft, color: T.primary, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: Math.max(9, size * 0.42), fontWeight: 700, flexShrink: 0 }}
    >
      {(name || "U").charAt(0).toUpperCase()}
    </span>
  );
}

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "var(--overlay)", backdropFilter: "blur(4px)", WebkitBackdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, cursor: "default", padding: 16 }}
      onClick={(e) => {
        e.stopPropagation();
        onCancel();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="sn-page"
        onClick={(e) => e.stopPropagation()}
        style={{ background: T.paper, border: `1px solid ${T.paperLine}`, borderRadius: 20, padding: "22px 22px 18px", width: "100%", maxWidth: 360, boxShadow: "var(--shadow-lg)" }}
      >
        <div style={{ fontSize: 17, fontWeight: 700, marginBottom: 6 }}>{title}</div>
        <div style={{ fontSize: 14, color: T.inkSoft, marginBottom: 20, lineHeight: 1.5 }}>{message}</div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button onClick={onCancel} style={secondaryBtn} autoFocus>
            ยกเลิก
          </button>
          <button onClick={onConfirm} style={{ ...primaryBtn, background: T.expense, color: "#fff" }}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ----------------------------------- styles ----------------------------------- */

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  borderRadius: 12,
  border: `1px solid ${T.paperLine}`,
  background: T.paper,
  fontSize: 16,
  color: T.ink,
  marginTop: 6,
  outline: "none",
};

export const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "11px 18px",
  borderRadius: 12,
  border: "none",
  background: T.primary,
  color: T.onPrimary,
  fontWeight: 700,
  fontSize: 14,
};

export const secondaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "11px 18px",
  borderRadius: 12,
  border: "none",
  background: T.paperDim,
  color: T.ink,
  fontWeight: 600,
  fontSize: 14,
};

export const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: T.primary,
  fontSize: 13,
  fontWeight: 700,
  padding: "4px 0",
};

export const iconBtn: React.CSSProperties = {
  background: T.paperDim,
  border: "none",
  color: T.ink,
  width: 36,
  height: 36,
  borderRadius: 10,
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: "block", fontSize: 13, fontWeight: 600, color: T.inkSoft, flex: "1 1 220px" }}>
      {label}
      {children}
    </label>
  );
}
