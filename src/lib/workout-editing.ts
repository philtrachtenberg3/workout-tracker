import type { Exercise, SetEntry, Workout } from "@prisma/client";
import type { EditableExercise, EditableSet, ParsedWorkout, WeightUnit } from "@/lib/types";
import { toDateOnlyString, todayDateOnlyString } from "@/lib/date-utils";

export function emptySet(): EditableSet {
  return {
    reps: null,
    weight: null,
    weightUnit: "lb",
    durationSeconds: null,
    distance: null,
    distanceUnit: null,
    rpe: null,
    notes: null,
  };
}

export function emptyExercise(): EditableExercise {
  return { name: "", sets: [emptySet()] };
}

export function emptyWorkout(): ParsedWorkout {
  return { date: todayDateOnlyString(), exercises: [emptyExercise()], notes: null };
}

type DbWorkout = Workout & { exercises: (Exercise & { sets: SetEntry[] })[] };

export function dbWorkoutToEditable(workout: DbWorkout): ParsedWorkout {
  return {
    date: toDateOnlyString(workout.date),
    notes: workout.notes,
    exercises: workout.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.map((s) => ({
        reps: s.reps,
        weight: s.weight,
        weightUnit: s.weightUnit as WeightUnit,
        durationSeconds: s.durationSeconds,
        distance: s.distance,
        distanceUnit: s.distanceUnit,
        rpe: s.rpe,
        notes: s.notes,
      })),
    })),
  };
}
