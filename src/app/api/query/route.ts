import { NextRequest, NextResponse } from "next/server";
import { answerWorkoutQuery } from "@/lib/query-workouts";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const question = body?.question;

  if (!question || typeof question !== "string") {
    return NextResponse.json({ error: "Missing question" }, { status: 400 });
  }

  try {
    const answer = await answerWorkoutQuery(question);
    return NextResponse.json({ answer });
  } catch (err) {
    console.error("Query failed", err);
    return NextResponse.json({ error: "Query failed" }, { status: 502 });
  }
}
