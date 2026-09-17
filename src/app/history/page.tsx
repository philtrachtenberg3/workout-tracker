import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate, formatExerciseLines } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function HistoryPage() {
  const workouts = await prisma.workout.findMany({
    include: { exercises: { include: { sets: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    orderBy: { date: "desc" },
  });

  if (workouts.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 pt-24 text-center">
        <p className="text-lg font-semibold tracking-tight">No workouts yet</p>
        <p className="text-sm text-muted-foreground">Record your first one from the Record tab.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 px-4 pt-8 pb-4">
      <h1 className="text-2xl font-bold tracking-tight">History</h1>
      {workouts.map((w) => (
        <Link key={w.id} href={`/history/${w.id}`}>
          <Card className="shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center justify-between text-sm font-semibold">
                <span>{formatDate(w.date)}</span>
                <Badge variant="secondary">
                  {w.exercises.length} exercise{w.exercises.length === 1 ? "" : "s"}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-sm">
              {w.exercises.map((ex) => (
                <div key={ex.id} className="flex items-start justify-between gap-2">
                  <span className="font-medium">{ex.name}</span>
                  <div className="flex flex-col items-end text-right text-muted-foreground">
                    {formatExerciseLines(ex).map((line, i) => (
                      <span key={i}>{line}</span>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
