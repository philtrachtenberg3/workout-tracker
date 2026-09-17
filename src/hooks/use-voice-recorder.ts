"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type VoiceRecorderStatus = "idle" | "recording" | "transcribing";

const MIME_CANDIDATES = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];

function pickMimeType(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  return MIME_CANDIDATES.find((t) => MediaRecorder.isTypeSupported(t));
}

interface Options {
  onTranscript: (transcript: string) => void;
  onError?: (message: string) => void;
}

interface Result {
  status: VoiceRecorderStatus;
  elapsedSeconds: number;
  start: () => Promise<void>;
  stop: () => void;
}

// Shared mic-record -> upload -> transcribe flow, used by both the main
// record screen and the Ask box's voice input.
export function useVoiceRecorder({ onTranscript, onError }: Options): Result {
  const [status, setStatus] = useState<VoiceRecorderStatus>("idle");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

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

  const start = useCallback(async () => {
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

        setStatus("transcribing");
        try {
          const formData = new FormData();
          formData.append("audio", blob, "recording.webm");
          const res = await fetch("/api/transcribe", { method: "POST", body: formData });
          if (!res.ok) throw new Error();
          const data = await res.json();
          onTranscript(data.transcript);
        } catch {
          onError?.("Transcription failed. Want to try again?");
        } finally {
          setStatus("idle");
        }
      };

      recorder.start();
      setElapsedSeconds(0);
      setStatus("recording");
      timerRef.current = setInterval(() => setElapsedSeconds((e) => e + 1), 1000);
    } catch {
      onError?.("Couldn't access the microphone. Check your browser permissions.");
    }
  }, [onTranscript, onError]);

  const stop = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    mediaRecorderRef.current?.stop();
  }, []);

  return { status, elapsedSeconds, start, stop };
}
