import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import { prisma } from "@/lib/prisma";
import { formatSet } from "@/lib/format";
import { toDateOnlyString, todayDateOnlyString } from "@/lib/date-utils";

const QUERY_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_workouts_in_range",
    description:
      "Get all workouts (with exercises and sets) logged between two dates, inclusive.",
    input_schema: {
      type: "object",
      properties: {
        start: { type: "string", description: "Start date, ISO format YYYY-MM-DD" },
        end: { type: "string", description: "End date, ISO format YYYY-MM-DD" },
      },
      required: ["start", "end"],
    },
  },
  {
    name: "get_exercise_history",
    description:
      "Get the most recent sets logged for a specific exercise (fuzzy name match), most recent workout first.",
    input_schema: {
      type: "object",
      properties: {
        exerciseName: { type: "string", description: "Exercise name or partial match, e.g. 'bench press'" },
        limit: { type: "integer", description: "Max number of workouts to return, default 10" },
      },
      required: ["exerciseName"],
    },
  },
];

async function getWorkoutsInRange(start: string, end: string) {
  const workouts = await prisma.workout.findMany({
    where: {
      date: {
        gte: new Date(`${start}T00:00:00`),
        lte: new Date(`${end}T23:59:59`),
      },
    },
    include: { exercises: { include: { sets: { orderBy: { order: "asc" } } }, orderBy: { order: "asc" } } },
    orderBy: { date: "asc" },
  });

  return workouts.map((w) => ({
    date: toDateOnlyString(w.date),
    notes: w.notes,
    exercises: w.exercises.map((ex) => ({
      name: ex.name,
      sets: ex.sets.map(formatSet),
    })),
  }));
}

async function getExerciseHistory(exerciseName: string, limit = 10) {
  const exercises = await prisma.exercise.findMany({
    where: { name: { contains: exerciseName } },
    include: { sets: { orderBy: { order: "asc" } }, workout: true },
    orderBy: { workout: { date: "desc" } },
    take: limit,
  });

  return exercises.map((ex) => ({
    date: toDateOnlyString(ex.workout.date),
    exercise: ex.name,
    sets: ex.sets.map(formatSet),
  }));
}

async function runTool(name: string, input: unknown): Promise<unknown> {
  switch (name) {
    case "get_workouts_in_range": {
      const { start, end } = input as { start: string; end: string };
      return getWorkoutsInRange(start, end);
    }
    case "get_exercise_history": {
      const { exerciseName, limit } = input as { exerciseName: string; limit?: number };
      return getExerciseHistory(exerciseName, limit ?? 10);
    }
    default:
      return { error: `Unknown tool: ${name}` };
  }
}

export async function answerWorkoutQuery(question: string): Promise<string> {
  const today = todayDateOnlyString();
  const messages: Anthropic.MessageParam[] = [{ role: "user", content: question }];

  const system = `You are a helpful workout tracking assistant. Today's date is ${today}. Always use the provided tools to look up the user's actual logged data before answering — never guess or estimate numbers. If a query implies a date range (e.g. "last week", "this month"), compute the actual dates yourself relative to today. Weights are already in the unit they were logged in. Be concise, specific, and reference dates or numbers directly from the data. If nothing matches, say so plainly rather than making something up.`;

  for (let i = 0; i < 4; i++) {
    const response = await anthropic.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 1024,
      system,
      tools: QUERY_TOOLS,
      messages,
    });

    messages.push({ role: "assistant", content: response.content });

    if (response.stop_reason !== "tool_use") {
      const textBlock = response.content.find((b) => b.type === "text");
      return textBlock && textBlock.type === "text" ? textBlock.text : "I couldn't find an answer.";
    }

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of response.content) {
      if (block.type !== "tool_use") continue;
      const result = await runTool(block.name, block.input);
      toolResults.push({
        type: "tool_result",
        tool_use_id: block.id,
        content: JSON.stringify(result),
      });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return "Sorry, I wasn't able to work that out.";
}
