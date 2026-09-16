"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Mic, Square, Loader2, RotateCcw, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutReviewForm } from "@/components/workout-review-form";
import type { ParsedWorkout } from "@/lib/types";
import { cn } from "@/lib/utils";

type Stage =
  | "idle"
  | "recording"
  | "transcribing"
  | "review-transcript"
  | "parsing"
  | "review-workout"
  | "saving";

const MIME_CANDIDATES = [
  "audio/webm;codecs=opus",
  "audio/webm",
  "audio/mp4",
];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function RecordFlow() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [elapsed, setElapsed] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [workout, setWorkout] = useState<ParsedWorkout | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType ?? "audio/webm" });
        await transcribe(blob);
      };

      recorder.start();
      setElapsed(0);
      setStage("recording");
      timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    } catch {
      toast.error("Couldn't access the microphone. Check your browser permissions.");
    }
  }, []);

  const stopRecording = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStage("transcribing");
    mediaRecorderRef.current?.stop();
  }, []);

  async function transcribe(blob: Blob) {
    try {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await fetch("/api/transcribe", { method: "POST", body: formData });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTranscript(data.transcript);
      setStage("review-transcript");
    } catch {
      toast.error("Transcription failed. Want to try recording again?");
      setStage("idle");
    }
  }

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
    setElapsed(0);
    setTranscript("");
    setWorkout(null);
  }

  return (
    <div className="flex flex-col gap-6 px-4 pt-8">
      {(stage === "idle" || stage === "recording" || stage === "transcribing") && (
        <div className="flex flex-col items-center gap-4 pt-12">
          <button
            type="button"
            onClick={stage === "recording" ? stopRecording : stage === "idle" ? startRecording : undefined}
            disabled={stage === "transcribing"}
            className={cn(
              "flex size-32 items-center justify-center rounded-full shadow-lg transition-all active:scale-95",
              stage === "recording"
                ? "bg-red-500 text-white animate-pulse"
                : "bg-primary text-primary-foreground hover:bg-primary/90",
              stage === "transcribing" && "opacity-60",
            )}
            aria-label={stage === "recording" ? "Stop recording" : "Start recording"}
          >
            {stage === "transcribing" ? (
              <Loader2 className="size-12 animate-spin" />
            ) : stage === "recording" ? (
              <Square className="size-10" fill="currentColor" />
            ) : (
              <Mic className="size-12" />
            )}
          </button>
          <div className="text-center">
            {stage === "recording" && (
              <p className="text-2xl font-mono tabular-nums">{formatElapsed(elapsed)}</p>
            )}
            <p className="mt-1 text-sm text-muted-foreground">
              {stage === "idle" && "Tap to start talking through your workout"}
              {stage === "recording" && "Recording — tap the square to stop"}
              {stage === "transcribing" && "Transcribing your recording…"}
            </p>
          </div>
        </div>
      )}

      {stage === "review-transcript" && (
        <div className="flex flex-col gap-4">
          <div>
            <h2 className="text-lg font-semibold">Here&apos;s what I heard</h2>
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
            <h2 className="text-lg font-semibold">Review your workout</h2>
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
