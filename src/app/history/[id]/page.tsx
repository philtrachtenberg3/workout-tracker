import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { WorkoutDetail } from "@/components/workout-detail";
import { dbWorkoutToEditable } from "@/lib/workout-editing";

export const dynamic = "force-dynamic";

export default async function WorkoutDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const workout = await prisma.workout.findUnique({
    where: { id },
    include: { exercises: { include: { sets: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
  });

  if (!workout) notFound();

  return (
    <WorkoutDetail
      id={workout.id}
      rawTranscript={workout.rawTranscript}
      initialWorkout={dbWorkoutToEditable(workout)}
    />
  );
}
