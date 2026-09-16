import { z } from "zod";

export const setPayloadSchema = z.object({
  reps: z.number().int().nullable().optional(),
  weight: z.number().nullable().optional(),
  weightUnit: z.enum(["lb", "kg"]).optional(),
  durationSeconds: z.number().int().nullable().optional(),
  distance: z.number().nullable().optional(),
  distanceUnit: z.string().nullable().optional(),
  rpe: z.number().nullable().optional(),
  notes: z.string().nullable().optional(),
});

export const exercisePayloadSchema = z.object({
  name: z.string().min(1),
  sets: z.array(setPayloadSchema),
});

export const workoutPayloadSchema = z.object({
  date: z.string().optional(),
  rawTranscript: z.string(),
  notes: z.string().nullable().optional(),
  exercises: z.array(exercisePayloadSchema),
});

// Editing a saved workout only ever changes date/notes/exercises — the
// original transcript it was parsed from is immutable, so it's not resent.
export const workoutUpdatePayloadSchema = workoutPayloadSchema.omit({ rawTranscript: true });

export type WorkoutPayload = z.infer<typeof workoutPayloadSchema>;
export type WorkoutUpdatePayload = z.infer<typeof workoutUpdatePayloadSchema>;

export function toPrismaExercisesCreate(exercises: WorkoutPayload["exercises"]) {
  return exercises.map((ex, i) => ({
    name: ex.name,
    order: i,
    sets: {
      create: ex.sets.map((s, j) => ({
        order: j,
        reps: s.reps ?? null,
        weight: s.weight ?? null,
        weightUnit: s.weightUnit ?? "lb",
        durationSeconds: s.durationSeconds ?? null,
        distance: s.distance ?? null,
        distanceUnit: s.distanceUnit ?? null,
        rpe: s.rpe ?? null,
        notes: s.notes ?? null,
      })),
    },
  }));
}
