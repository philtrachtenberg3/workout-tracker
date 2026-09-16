export type WeightUnit = "lb" | "kg";

export interface EditableSet {
  reps: number | null;
  weight: number | null;
  weightUnit: WeightUnit;
  durationSeconds: number | null;
  distance: number | null;
  distanceUnit: string | null;
  rpe: number | null;
  notes: string | null;
}

export interface EditableExercise {
  name: string;
  sets: EditableSet[];
}

export interface ParsedWorkout {
  date: string; // ISO date, YYYY-MM-DD
  exercises: EditableExercise[];
  notes?: string | null;
}
