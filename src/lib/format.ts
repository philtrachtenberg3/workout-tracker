import { fromDateOnlyString } from "@/lib/date-utils";

export interface FormatableSet {
  reps: number | null;
  weight: number | null;
  weightUnit: string;
  durationSeconds: number | null;
  distance: number | null;
  distanceUnit: string | null;
  rpe: number | null;
  notes: string | null;
}

export function formatSet(set: FormatableSet): string {
  const parts: string[] = [];
  if (set.reps != null && set.weight != null) {
    parts.push(`${set.reps} reps @ ${set.weight}${set.weightUnit}`);
  } else if (set.reps != null) {
    parts.push(`${set.reps} reps`);
  } else if (set.weight != null) {
    parts.push(`@ ${set.weight}${set.weightUnit}`);
  }
  if (set.durationSeconds != null) {
    const total = set.durationSeconds;
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    const bits = [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean);
    parts.push(bits.length ? bits.join(" ") : "0s");
  }
  if (set.distance != null) {
    parts.push(`${set.distance}${set.distanceUnit ?? ""}`);
  }
  if (set.rpe != null) parts.push(`RPE ${set.rpe}`);
  if (set.notes) parts.push(`(${set.notes})`);
  return parts.join(", ") || "—";
}

export function formatDate(date: Date | string): string {
  // A bare "YYYY-MM-DD" string parses as UTC midnight via `new Date(...)`,
  // which can display as the previous day west of UTC — go through the
  // local-noon-anchored parser for those instead.
  const d =
    typeof date === "string"
      ? /^\d{4}-\d{2}-\d{2}$/.test(date)
        ? fromDateOnlyString(date)
        : new Date(date)
      : date;
  return d.toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
