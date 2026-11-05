import { useEffect, useState } from "react";

export default function Toast({ toast }) {
  const [phase, setPhase] = useState("hidden");

  useEffect(() => {
    if (!toast) return;

    setPhase("visible");
    const fade = setTimeout(() => setPhase("fading"), 2000);
    const hide = setTimeout(() => setPhase("hidden"), 2300);
    return () => {
      clearTimeout(fade);
      clearTimeout(hide);
    };
  }, [toast]);

  return (
    <div
      id="toast-message"
      className="toast"
      role="status"
      hidden={phase === "hidden"}
      style={{ opacity: phase === "visible" ? 1 : 0 }}
    >
      {toast?.message}
    </div>
  );
}
