import { NextRequest, NextResponse } from "next/server";
import { transcribeAudio } from "@/lib/openai";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audio = formData.get("audio");

  if (!(audio instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  try {
    const buffer = Buffer.from(await audio.arrayBuffer());
    const transcript = await transcribeAudio(
      buffer,
      "recording.webm",
      audio.type || "audio/webm",
    );
    return NextResponse.json({ transcript });
  } catch (err) {
    console.error("Transcription failed", err);
    return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
  }
}
