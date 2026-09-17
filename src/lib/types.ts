export type WeightUnit = "lb" | "kg";

// "sets": one or more discrete sets, each tracked individually.
// "total": a single reported aggregate ("100 push-ups", "ran for 20 min")
// with no implied set breakdown — always exactly one EditableSet.
export type ExerciseStructure = "sets" | "total";

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
  structure: ExerciseStructure;
  sets: EditableSet[];
}

export interface ParsedWorkout {
  date: string; // ISO date, YYYY-MM-DD
  exercises: EditableExercise[];
  notes?: string | null;
}
