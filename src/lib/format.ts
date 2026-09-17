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

export interface FormatableExercise {
  structure: string; // "sets" | "total"
  sets: FormatableSet[];
}

function setsEqual(a: FormatableSet, b: FormatableSet): boolean {
  return (
    a.reps === b.reps &&
    a.weight === b.weight &&
    a.weightUnit === b.weightUnit &&
    a.durationSeconds === b.durationSeconds &&
    a.distance === b.distance &&
    a.distanceUnit === b.distanceUnit &&
    a.rpe === b.rpe &&
    a.notes === b.notes
  );
}

// Summary lines used in list views, one per line — respects "total"
// exercises so they never get mislabeled as "1 set" (which implies one
// continuous unbroken set), and groups consecutive identical sets so a
// pyramid/drop set doesn't get flattened into "N sets" of just the first
// set's numbers. The exercise name is shown once by the caller; each
// returned line covers one group of identical sets.
export function formatExerciseLines(ex: FormatableExercise): string[] {
  if (ex.structure === "total") {
    const first = ex.sets[0];
    return first ? [formatSet(first)] : ["—"];
  }
  if (ex.sets.length === 0) return ["—"];

  const groups: { count: number; set: FormatableSet }[] = [];
  for (const set of ex.sets) {
    const last = groups[groups.length - 1];
    if (last && setsEqual(last.set, set)) {
      last.count += 1;
    } else {
      groups.push({ count: 1, set });
    }
  }

  return groups.map((g) => `${g.count} set${g.count === 1 ? "" : "s"} · ${formatSet(g.set)}`);
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
