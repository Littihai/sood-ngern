import { useCallback, useState } from "react";

/** Runs an async UI action, tracking `busy` and a user-facing `error` / `notice`. */
export function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const run = useCallback(async (task: () => Promise<void>, successMessage?: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await task();
      if (successMessage) setNotice(successMessage);
      return true;
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "";
      setError(
        message.includes("permission-denied") || message.includes("Missing or insufficient permissions")
          ? "คุณไม่มีสิทธิ์ทำรายการนี้"
          : message || "เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง"
      );
      return false;
    } finally {
      setBusy(false);
    }
  }, []);

  const reset = useCallback(() => {
    setError("");
    setNotice("");
  }, []);

  return { busy, error, notice, run, reset };
}
