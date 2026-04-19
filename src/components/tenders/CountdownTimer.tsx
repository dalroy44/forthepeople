"use client";

import { useEffect, useState } from "react";

export default function CountdownTimer({ deadline, compact = false }: { deadline: string; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const target = new Date(deadline).getTime();
  const diff = target - now;

  if (diff <= 0) {
    return <span style={{ color: "#6B7280", fontSize: compact ? 12 : 14 }}>Closed</span>;
  }
  const days = Math.floor(diff / 86400_000);
  const hours = Math.floor((diff % 86400_000) / 3600_000);
  const mins = Math.floor((diff % 3600_000) / 60_000);
  const secs = Math.floor((diff % 60_000) / 1000);

  const urgent = diff < 48 * 3600_000;
  const color = urgent ? "#DC2626" : "#0F172A";
  if (compact) {
    if (days >= 1) return <span style={{ color, fontSize: 12, fontWeight: 600 }}>{days}d {hours}h</span>;
    return <span style={{ color, fontSize: 12, fontWeight: 700 }}>{hours}h {mins}m</span>;
  }
  return (
    <span style={{ color, fontVariantNumeric: "tabular-nums", fontSize: 14, fontWeight: 600 }}>
      {days > 0 ? `${days}d ` : ""}{hours}h {mins}m {secs}s
    </span>
  );
}
