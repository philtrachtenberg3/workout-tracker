import { NextRequest, NextResponse } from "next/server";
import { parseWorkoutTranscript } from "@/lib/parse-workout";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const transcript = body?.transcript;

  if (!transcript || typeof transcript !== "string") {
    return NextResponse.json({ error: "Missing transcript" }, { status: 400 });
  }

  try {
    const parsed = await parseWorkoutTranscript(transcript);
    return NextResponse.json(parsed);
  } catch (err) {
    console.error("Parsing failed", err);
    return NextResponse.json({ error: "Parsing failed" }, { status: 502 });
  }
}
