"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";

// Bare number = seconds (handy for short holds like "45" for a plank).
// Otherwise m:ss or h:mm:ss, like a stopwatch readout.
function parseDuration(input: string): number | null {
  const trimmed = input.trim();
  if (!trimmed) return null;
  if (/^\d+$/.test(trimmed)) return Number(trimmed);

  const parts = trimmed.split(":").map((p) => p.trim());
  if (parts.length < 2 || parts.length > 3 || parts.some((p) => p === "" || Number.isNaN(Number(p)))) {
    return null;
  }
  const nums = parts.map(Number);
  if (nums.length === 2) {
    const [m, s] = nums;
    return m * 60 + s;
  }
  const [h, m, s] = nums;
  return h * 3600 + m * 60 + s;
}

function formatDuration(totalSeconds: number | null): string {
  if (totalSeconds == null) return "";
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

interface Props {
  value: number | null;
  onChange: (seconds: number | null) => void;
  className?: string;
}

export function DurationField({ value, onChange, className }: Props) {
  const [text, setText] = useState(() => formatDuration(value));
  const [lastValue, setLastValue] = useState(value);

  // Re-derive the draft text when `value` changes from outside (not from
  // this field's own onBlur) — adjusted during render per React's guidance,
  // rather than in an effect, to avoid an extra render pass.
  if (value !== lastValue) {
    setLastValue(value);
    setText(formatDuration(value));
  }

  return (
    <Input
      type="text"
      inputMode="numeric"
      value={text}
      placeholder="m:ss"
      className={className}
      onChange={(e) => setText(e.target.value)}
      onBlur={() => {
        const seconds = parseDuration(text);
        onChange(seconds);
        setText(formatDuration(seconds));
      }}
    />
  );
}
