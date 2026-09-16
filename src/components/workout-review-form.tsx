"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { DurationField } from "@/components/duration-field";
import { Plus, Trash2 } from "lucide-react";
import type { EditableExercise, EditableSet, ParsedWorkout, WeightUnit } from "@/lib/types";
import { emptyExercise, emptySet } from "@/lib/workout-editing";

interface Props {
  value: ParsedWorkout;
  onChange: (next: ParsedWorkout) => void;
}

export function WorkoutReviewForm({ value, onChange }: Props) {
  function updateExercise(i: number, patch: Partial<EditableExercise>) {
    onChange({
      ...value,
      exercises: value.exercises.map((ex, idx) => (idx === i ? { ...ex, ...patch } : ex)),
    });
  }

  function updateSet(exIdx: number, setIdx: number, patch: Partial<EditableSet>) {
    onChange({
      ...value,
      exercises: value.exercises.map((ex, idx) => {
        if (idx !== exIdx) return ex;
        return { ...ex, sets: ex.sets.map((s, j) => (j === setIdx ? { ...s, ...patch } : s)) };
      }),
    });
  }

  function addSet(exIdx: number) {
    onChange({
      ...value,
      exercises: value.exercises.map((ex, idx) =>
        idx === exIdx ? { ...ex, sets: [...ex.sets, emptySet()] } : ex,
      ),
    });
  }

  function removeSet(exIdx: number, setIdx: number) {
    onChange({
      ...value,
      exercises: value.exercises.map((ex, idx) =>
        idx === exIdx ? { ...ex, sets: ex.sets.filter((_, j) => j !== setIdx) } : ex,
      ),
    });
  }

  function addExercise() {
    onChange({ ...value, exercises: [...value.exercises, emptyExercise()] });
  }

  function removeExercise(i: number) {
    onChange({ ...value, exercises: value.exercises.filter((_, idx) => idx !== i) });
  }

  const numberValue = (n: number | null) => (n === null || Number.isNaN(n) ? "" : n);

  return (
    <div className="space-y-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="workout-date">Date</Label>
        <Input
          id="workout-date"
          type="date"
          value={value.date}
          onChange={(e) => onChange({ ...value, date: e.target.value })}
          className="w-fit"
        />
      </div>
      {value.exercises.map((ex, exIdx) => {
        const showDuration = ex.sets.some((s) => s.durationSeconds != null);
        const showDistance = ex.sets.some((s) => s.distance != null);
        const showRpe = ex.sets.some((s) => s.rpe != null);

        return (
          <Card key={exIdx}>
            <CardHeader className="flex-row items-center gap-2 space-y-0 pb-2">
              <Input
                value={ex.name}
                onChange={(e) => updateExercise(exIdx, { name: e.target.value })}
                placeholder="Exercise name"
                className="text-base font-semibold"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeExercise(exIdx)}
                aria-label="Remove exercise"
              >
                <Trash2 className="size-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-1.5">
              <div className="flex items-center gap-1.5 px-1 text-[10px] uppercase tracking-wide text-muted-foreground">
                <span className="w-5 shrink-0">#</span>
                <span className="flex-1">Reps</span>
                <span className="flex-[1.4]">Weight</span>
                {showDuration && <span className="flex-1">Time</span>}
                {showDistance && <span className="flex-1">Dist</span>}
                {showRpe && <span className="flex-1">RPE</span>}
                <span className="w-7 shrink-0" />
              </div>
              {ex.sets.map((set, setIdx) => (
                <div key={setIdx} className="flex items-center gap-1.5">
                  <span className="w-5 shrink-0 text-xs text-muted-foreground">{setIdx + 1}</span>
                  <Input
                    type="number"
                    inputMode="numeric"
                    className="flex-1 px-2"
                    value={numberValue(set.reps)}
                    onChange={(e) =>
                      updateSet(exIdx, setIdx, {
                        reps: e.target.value === "" ? null : Number(e.target.value),
                      })
                    }
                    placeholder="—"
                  />
                  <div className="flex flex-[1.4] items-center gap-1">
                    <Input
                      type="number"
                      inputMode="decimal"
                      className="px-2"
                      value={numberValue(set.weight)}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          weight: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                      placeholder="—"
                    />
                    <select
                      className="h-8 shrink-0 rounded-md border border-input bg-transparent px-1 text-xs"
                      value={set.weightUnit}
                      onChange={(e) => updateSet(exIdx, setIdx, { weightUnit: e.target.value as WeightUnit })}
                    >
                      <option value="lb">lb</option>
                      <option value="kg">kg</option>
                    </select>
                  </div>
                  {showDuration && (
                    <DurationField
                      className="flex-1 px-2"
                      value={set.durationSeconds}
                      onChange={(seconds) => updateSet(exIdx, setIdx, { durationSeconds: seconds })}
                    />
                  )}
                  {showDistance && (
                    <Input
                      type="number"
                      className="flex-1 px-2"
                      value={numberValue(set.distance)}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          distance: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  )}
                  {showRpe && (
                    <Input
                      type="number"
                      className="flex-1 px-2"
                      value={numberValue(set.rpe)}
                      onChange={(e) =>
                        updateSet(exIdx, setIdx, {
                          rpe: e.target.value === "" ? null : Number(e.target.value),
                        })
                      }
                    />
                  )}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => removeSet(exIdx, setIdx)}
                    aria-label="Remove set"
                    className="shrink-0"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={() => addSet(exIdx)} className="mt-1.5">
                <Plus className="size-3.5" /> Add set
              </Button>
            </CardContent>
          </Card>
        );
      })}
      <Button type="button" variant="outline" onClick={addExercise} className="w-full">
        <Plus className="size-4" /> Add exercise
      </Button>
    </div>
  );
}
