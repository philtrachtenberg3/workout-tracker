import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workoutPayloadSchema, toPrismaExercisesCreate } from "@/lib/workout-payload";
import { fromDateOnlyString } from "@/lib/date-utils";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const workouts = await prisma.workout.findMany({
    where: {
      ...(from || to
        ? {
            date: {
              ...(from ? { gte: new Date(`${from}T00:00:00`) } : {}),
              ...(to ? { lte: new Date(`${to}T23:59:59`) } : {}),
            },
          }
        : {}),
    },
    include: { exercises: { include: { sets: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(workouts);
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = workoutPayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { date, rawTranscript, notes, exercises } = parsed.data;

  const workout = await prisma.workout.create({
    data: {
      date: date ? fromDateOnlyString(date) : new Date(),
      rawTranscript,
      notes,
      exercises: { create: toPrismaExercisesCreate(exercises) },
    },
    include: { exercises: { include: { sets: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });

  return NextResponse.json(workout, { status: 201 });
}
