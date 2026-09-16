import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { workoutUpdatePayloadSchema, toPrismaExercisesCreate } from "@/lib/workout-payload";
import { fromDateOnlyString } from "@/lib/date-utils";

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: { exercises: { include: { sets: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });
  if (!workout) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(workout);
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const body = await req.json().catch(() => null);
  const parsed = workoutUpdatePayloadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload", details: parsed.error.flatten() }, { status: 400 });
  }
  const { date, notes, exercises } = parsed.data;

  const existing = await prisma.workout.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await prisma.exercise.deleteMany({ where: { workoutId: id } });
  const workout = await prisma.workout.update({
    where: { id },
    data: {
      date: date ? fromDateOnlyString(date) : undefined,
      notes,
      exercises: { create: toPrismaExercisesCreate(exercises) },
    },
    include: { exercises: { include: { sets: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });

  return NextResponse.json(workout);
}

export async function DELETE(_req: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const existing = await prisma.workout.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await prisma.workout.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
