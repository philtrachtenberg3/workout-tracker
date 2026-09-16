// Workout dates are calendar dates, not instants — "2026-09-13" should mean
// the same day everywhere regardless of timezone. Converting through UTC
// (e.g. `date.toISOString().slice(0, 10)` or `new Date("2026-09-13")`, which
// parses as UTC midnight) can silently shift the day for anyone not at
// UTC+0. These helpers stay in local-time components throughout, with a
// noon anchor as extra insurance against any UTC round-trip in storage.

export function toDateOnlyString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function fromDateOnlyString(dateStr: string): Date {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d, 12, 0, 0);
}

export function todayDateOnlyString(): string {
  return toDateOnlyString(new Date());
}
