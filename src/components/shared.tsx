import React, { useState } from "react";
import { Trash2 } from "lucide-react";
import { T, catById, fmtMoney, fmtDateShort } from "../theme";
import { Transaction } from "../types";

export function TearDivider() {
  const holes = new Array(28).fill(0);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, margin: "10px 0" }} aria-hidden="true">
      {holes.map((_, i) => (
        <div key={i} style={{ width: 4, height: 4, borderRadius: "50%", background: T.paperLine, flex: "1 0 auto" }} />
      ))}
    </div>
  );
}

export function Card({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div style={{ border: `1px solid ${T.paperLine}`, borderRadius: 14, padding: "16px 18px", background: T.paper }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.inkSoft, textTransform: "uppercase", letterSpacing: 0.6 }}>{title}</div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function MiniStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ border: `1px solid ${T.paperLine}`, borderRadius: 12, padding: "10px 12px", background: T.paper }}>
      <div style={{ fontSize: 11, color: T.inkSoft }}>{label}</div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 600, color, marginTop: 2 }}>
        {value < 0 ? "-" : ""}฿{fmtMoney(value)}
      </div>
    </div>
  );
}

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
  const Icon = cat.icon;
  const isIncome = tx.type === "income";

  return (
    <div onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 10, padding: "6px 0", cursor: onClick ? "pointer" : "default" }}>
      <div
        style={{
          width: 34, height: 34, borderRadius: 8, background: cat.color + "1c",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}
      >
        <Icon size={16} color={cat.color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 13.5, fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {tx.note ? tx.note : cat.label}
        </div>
        <div style={{ fontSize: 11, color: T.inkSoft }}>
          {cat.label} · {fmtDateShort(tx.date)}
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 5, maxWidth: 130, color: T.inkSoft, fontSize: 10.5 }}>
        {tx.createdByPhotoURL ? (
          <img src={tx.createdByPhotoURL} alt="" style={{ width: 16, height: 16, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <span style={{ width: 16, height: 16, borderRadius: "50%", background: T.paperDim, display: "inline-flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, flexShrink: 0 }}>
            {(tx.createdByName || "U").charAt(0).toUpperCase()}
          </span>
        )}
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tx.createdByName || "Unknown"}</span>
      </div>
      <div className="mono" style={{ fontSize: 14, fontWeight: 600, color: isIncome ? T.income : T.expense, whiteSpace: "nowrap" }}>
        {isIncome ? "+" : "-"}฿{fmtMoney(tx.amount)}
      </div>
      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowConfirm(true);
          }}
          style={{ background: "transparent", border: "none", color: T.inkSoft, padding: 4, marginLeft: 2, cursor: "pointer" }}
          aria-label="ลบรายการ" // เพิ่มตรวจสอบก่อนลบรายการ
        >
          <Trash2 size={14} />
        </button>
      )}

      {/* Custom Confirmation Modal */}
      {showConfirm && (
        <div 
          style={modalOverlayStyle} 
          onClick={(e) => { 
            e.stopPropagation();
            setShowConfirm(false); 
          }}
        >
          <div style={modalContentStyle} onClick={(e) => e.stopPropagation()}>
            <div style={{ fontSize: 15, fontWeight: 600, color: T.ink, marginBottom: 6 }}>
              ยืนยันการลบรายการ
            </div>
            <div style={{ fontSize: 12.5, color: T.inkSoft, marginBottom: 20, lineHeight: 1.4 }}>
              คุณต้องการลบรายการ "{tx.note ? tx.note : cat.label}" ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setShowConfirm(false)}
                style={cancelBtnStyle}
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onDelete?.(tx.id); // ใส่ Optional Chaining ลบเออร์เรอร์ TypeScript เรียบร้อย
                  setShowConfirm(false);
                }}
                style={deleteBtnStyle}
              >
                ลบรายการ
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* --- Styles ที่ใช้ร่วมกันในไฟล์ --- */

const modalOverlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100vw",
  height: "100vh",
  backgroundColor: "rgba(0, 0, 0, 0.25)",
  backdropFilter: "blur(4px)",
  WebkitBackdropFilter: "blur(4px)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  zIndex: 9999,
  cursor: "default",
};

const modalContentStyle: React.CSSProperties = {
  background: T.paper,
  border: `1px solid ${T.paperLine}`,
  borderRadius: 14,
  padding: "20px 22px",
  width: "90%",
  maxWidth: 320,
  boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: T.paperDim,
  color: T.inkSoft,
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

const deleteBtnStyle: React.CSSProperties = {
  padding: "8px 14px",
  borderRadius: 8,
  border: "none",
  background: T.expense,
  color: "#ffffff",
  fontSize: 12.5,
  fontWeight: 600,
  cursor: "pointer",
};

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "9px 12px",
  borderRadius: 8,
  border: `1px solid ${T.paperLine}`,
  background: T.paper,
  fontSize: 14,
  color: T.ink,
  marginTop: 6,
  outline: "none",
};

export const primaryBtn: React.CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
  padding: "10px 18px",
  borderRadius: 10,
  border: "none",
  background: T.ink,
  color: T.paper,
  fontWeight: 600,
  fontSize: 13,
};

export const ghostBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: T.gold,
  fontSize: 12,
  fontWeight: 600,
  padding: 0,
};

export const iconBtn: React.CSSProperties = {
  background: "transparent",
  border: "none",
  color: T.ink,
  padding: 6,
  borderRadius: 8,
};