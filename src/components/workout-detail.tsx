"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutReviewForm } from "@/components/workout-review-form";
import { formatDate, formatSet } from "@/lib/format";
import type { ParsedWorkout } from "@/lib/types";

interface Props {
  id: string;
  rawTranscript: string;
  initialWorkout: ParsedWorkout;
}

export function WorkoutDetail({ id, rawTranscript, initialWorkout }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [workout, setWorkout] = useState(initialWorkout);
  const [saving, setSaving] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  async function save() {
    setSaving(true);
    try {
      const res = await fetch(`/api/workouts/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: workout.date, notes: workout.notes, exercises: workout.exercises }),
      });
      if (!res.ok) throw new Error();
      toast.success("Workout updated");
      setEditing(false);
      router.refresh();
    } catch {
      toast.error("Couldn't save changes");
    } finally {
      setSaving(false);
    }
  }

  async function remove() {
    if (!window.confirm("Delete this workout? This can't be undone.")) return;
    try {
      const res = await fetch(`/api/workouts/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();
      toast.success("Workout deleted");
      router.push("/history");
      router.refresh();
    } catch {
      toast.error("Couldn't delete workout");
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pt-6 pb-4">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-lg font-bold">{formatDate(workout.date)}</h1>
        <div className="flex gap-2">
          {editing ? (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setWorkout(initialWorkout);
                  setEditing(false);
                }}
              >
                <X className="size-4" /> Cancel
              </Button>
              <Button size="sm" onClick={save} disabled={saving}>
                <Check className="size-4" /> Save
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => setEditing(true)}>
                <Pencil className="size-4" /> Edit
              </Button>
              <Button variant="destructive" size="sm" onClick={remove}>
                <Trash2 className="size-4" />
              </Button>
            </>
          )}
        </div>
      </div>

      {editing ? (
        <WorkoutReviewForm value={workout} onChange={setWorkout} />
      ) : (
        <div className="flex flex-col gap-3">
          {workout.exercises.map((ex, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{ex.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-sm">
                {ex.sets.map((s, j) => (
                  <div key={j} className="flex gap-2">
                    <span className="w-5 text-muted-foreground">{j + 1}</span>
                    <span>{formatSet(s)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
          {workout.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent className="text-sm">{workout.notes}</CardContent>
            </Card>
          )}
        </div>
      )}

      <button
        type="button"
        className="text-left text-xs text-muted-foreground underline underline-offset-2"
        onClick={() => setShowTranscript((v) => !v)}
      >
        {showTranscript ? "Hide" : "Show"} original transcript
      </button>
      {showTranscript && (
        <Card>
          <CardContent className="pt-4 text-sm whitespace-pre-wrap text-muted-foreground">
            {rawTranscript}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
