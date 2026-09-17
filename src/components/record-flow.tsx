"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, Square, Loader2, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutReviewForm } from "@/components/workout-review-form";
import { useVoiceRecorder } from "@/hooks/use-voice-recorder";
import type { ParsedWorkout } from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage = "idle" | "review-transcript" | "parsing" | "review-workout" | "saving";

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecordFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [transcript, setTranscript] = useState("");
  const [workout, setWorkout] = useState<ParsedWorkout | null>(null);

  const recorder = useVoiceRecorder({
    onTranscript: (text) => {
      setTranscript(text);
      setStage("review-transcript");
    },
    onError: (message) => toast.error(message),
  });

  async function parseTranscript() {
    setStage("parsing");
    try {
      const res = await fetch("/api/parse", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ transcript }),
      });
      if (!res.ok) throw new Error();
      const data: ParsedWorkout = await res.json();
      setWorkout(data);
      setStage("review-workout");
    } catch {
      toast.error("Couldn't parse that into a workout. You can edit the transcript and try again.");
      setStage("review-transcript");
    }
  }

  async function saveWorkout() {
    if (!workout) return;
    setStage("saving");
    try {
      const res = await fetch("/api/workouts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: workout.date,
          rawTranscript: transcript,
          notes: workout.notes,
          exercises: workout.exercises,
        }),
      });
      if (!res.ok) throw new Error();
      toast.success("Workout saved");
      reset();
      router.refresh();
    } catch {
      toast.error("Couldn't save the workout. Try again.");
      setStage("review-workout");
    }
  }

  function reset() {
    setStage("idle");
    setTranscript("");
    setWorkout(null);
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8">
      {stage === "idle" && (
        <div className="flex flex-col items-center gap-5 pt-12">
          <button
            type="button"
            onClick={
              recorder.status === "recording"
                ? recorder.stop
                : recorder.status === "idle"
                  ? recorder.start
                  : undefined
            }
            disabled={recorder.status === "transcribing"}
            className={cn(
              "flex size-32 items-center justify-center rounded-full transition-all active:scale-95",
              recorder.status === "recording"
                ? "bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse"
                : "bg-primary text-primary-foreground shadow-lg shadow-primary/30 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/40",
              recorder.status === "transcribing" && "opacity-60",
            )}
            aria-label={recorder.status === "recording" ? "Stop recording" : "Start recording"}
          >
            {recorder.status === "transcribing" ? (
              <Loader2 className="size-12 animate-spin" />
            ) : recorder.status === "recording" ? (
              <Square className="size-10" fill="currentColor" />
            ) : (
              <Mic className="size-12" />
            )}
          </button>
          <div className="text-center">
            {recorder.status === "recording" && (
              <p className="text-2xl font-mono font-medium tabular-nums">
                {formatElapsed(recorder.elapsedSeconds)}
              </p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {recorder.status === "idle" && "Tap to start talking through your workout"}
              {recorder.status === "recording" && "Recording — tap the square to stop"}
              {recorder.status === "transcribing" && "Transcribing your recording…"}
            </p>
          </div>
        </div>
      )}

      {stage === "review-transcript" && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Here&apos;s what I heard</h2>
            <p className="text-sm text-muted-foreground">Fix anything that got mis-transcribed, then continue.</p>
          </div>
          <Textarea
            value={transcript}
            onChange={(e) => setTranscript(e.target.value)}
            rows={10}
            className="text-base"
          />
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={reset}>
              <RotateCcw className="size-4" /> Redo
            </Button>
            <Button className="flex-1" onClick={parseTranscript} disabled={!transcript.trim()}>
              <Check className="size-4" /> Continue
            </Button>
          </div>
        </div>
      )}

      {stage === "parsing" && (
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <Loader2 className="size-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Turning that into a workout log…</p>
        </div>
      )}

      {stage === "review-workout" && workout && (
        <div className="flex flex-col gap-4 pb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Review your workout</h2>
            <p className="text-sm text-muted-foreground">Double-check the numbers before saving.</p>
          </div>
          <WorkoutReviewForm value={workout} onChange={setWorkout} />
          {workout.notes && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={workout.notes ?? ""}
                  onChange={(e) => setWorkout({ ...workout, notes: e.target.value })}
                  rows={2}
                />
              </CardContent>
            </Card>
          )}
          <div className="flex gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setStage("review-transcript")}>
              Back
            </Button>
            <Button className="flex-1" onClick={saveWorkout}>
              <Check className="size-4" /> Save workout
            </Button>
          </div>
        </div>
      )}

      {stage === "saving" && (
        <div className="flex flex-col items-center gap-3 pt-16 text-center">
          <Loader2 className="size-10 animate-spin text-muted-foreground" />
          <p className="text-sm text-muted-foreground">Saving…</p>
        </div>
      )}
    </div>
  );
}
