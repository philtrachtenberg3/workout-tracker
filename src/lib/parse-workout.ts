import type Anthropic from "@anthropic-ai/sdk";
import { anthropic, CLAUDE_MODEL } from "@/lib/anthropic";
import type { ParsedWorkout } from "@/lib/types";
import { todayDateOnlyString } from "@/lib/date-utils";

const LOG_WORKOUT_TOOL: Anthropic.Tool = {
  name: "log_workout",
  description:
    "Record the structured workout data extracted from the user's spoken description of their workout.",
  input_schema: {
    type: "object",
    properties: {
      date: {
        type: ["string", "null"],
        description:
          "The date this workout happened, as an absolute YYYY-MM-DD date. Resolve relative phrases like 'yesterday', 'three days ago', 'last Monday' against today's date given in the system prompt. If the transcript gives no date/time reference at all, use null.",
      },
      exercises: {
        type: "array",
        description: "Exercises in the order the user performed them.",
        items: {
          type: "object",
          properties: {
            name: {
              type: "string",
              description:
                "Normalized exercise name, e.g. 'Bench Press', 'Back Squat', 'Pull-Up'. Fix obvious mis-transcriptions using gym context.",
            },
            structure: {
              type: "string",
              enum: ["sets", "total"],
              description:
                "'sets' when the user describes one or more discrete sets (explicit set/round counting language, 'x' notation like '5x5', or multiple distinct performances of the exercise). 'total' when the user gives a single aggregate number or duration for the whole exercise with no set breakdown (a class, a duration of cardio, or a rep count reported as a session total, e.g. '100 push-ups', 'body pump for an hour', 'shot baskets for 15 minutes'). When 'total', the sets array must contain exactly one entry — do not invent a set breakdown that wasn't said.",
            },
            sets: {
              type: "array",
              description:
                "Each individual set performed for this exercise, in order. If the user gives a shorthand like '3 sets of 10 at 135', expand it into 3 separate set objects. For a 'total'-structure exercise, this is exactly one entry holding the aggregate value(s). Omit fields that don't apply rather than guessing.",
              items: {
                type: "object",
                properties: {
                  reps: { type: ["integer", "null"], description: "Reps performed in this set." },
                  weight: { type: ["number", "null"], description: "Weight used for this set." },
                  weightUnit: { type: "string", enum: ["lb", "kg"], description: "Defaults to lb unless the user says kg/kilos." },
                  durationSeconds: { type: ["integer", "null"], description: "For timed sets (planks, holds, cardio) — total seconds." },
                  distance: { type: ["number", "null"], description: "For cardio — distance covered." },
                  distanceUnit: { type: ["string", "null"], description: "Unit for distance, e.g. 'mi', 'km', 'm'." },
                  rpe: { type: ["number", "null"], description: "Rate of perceived exertion 1-10, only if the user mentions it explicitly (e.g. 'that was an 8 out of 10', 'felt like a 9', 'had 2 reps left in the tank' → rpe 8)." },
                  notes: { type: ["string", "null"], description: "Short note on this specific set only if the user said something noteworthy (e.g. 'failed the last rep', 'felt easy', 'with a spotter')." },
                },
                required: [],
              },
            },
          },
          required: ["name", "structure", "sets"],
        },
      },
      notes: {
        type: ["string", "null"],
        description: "Any overall notes about the workout not tied to one exercise (e.g. how they felt, soreness, time of day, warmup description).",
      },
    },
    required: ["exercises"],
  },
};

function buildSystemPrompt(): string {
  const today = todayDateOnlyString();
  const weekday = new Date().toLocaleDateString(undefined, { weekday: "long" });

  return `You turn a spoken, rambling description of a workout into clean structured data. The transcript may include filler words, false starts, self-corrections ("actually make that 185"), and casual gym language.

Today's date is ${today} (a ${weekday}).

Rules:
- Expand shorthand like "3 sets of 10 at 135" into 3 individual set entries (structure "sets").
- Decide each exercise's structure carefully:
  - "sets" when the user uses explicit set/round counting language ("3 sets of...", "5x5", "3 rounds of..."), or narrates multiple distinct performances of the exercise even without the word "sets" (e.g. "135 for 10, then 145 for 8"), or explicitly says it was one set ("just one set today, 20 pull-ups").
  - "total" when the user gives one cumulative number or duration for the whole exercise with no set-counting language — classes, cardio/sport sessions, or a rep count reported as a session total (e.g. "100 push-ups", "100 sit-ups", "body pump class for an hour", "shot baskets for 15 minutes", "planked for 5 minutes", "ran 2 miles"). This is the default when a single number is given with no set language, since it usually represents effort accumulated across multiple unstated sets, not one unbroken set.
  - A "total" exercise's sets array always has exactly one entry — never split a total into an invented set breakdown.
- If the user corrects themselves, use the corrected value only — this applies to any field, including weight unit (e.g. "135 pounds... wait I mean kilograms" -> kg for the whole exercise, not just that mention).
- If reps/weight change across sets (e.g. a pyramid or drop set), record each set's actual values, not an average.
- Warm-up sets the user explicitly calls out as warm-ups should still be included as sets, in order, before the working sets.
- Default weight unit is lb unless the user clearly says kg/kilograms.
- Bodyweight exercises (push-ups, pull-ups, etc.) with no weight mentioned should have weight left null, not zero.
- Do not invent numbers that weren't said or clearly implied. Leave a field out (null) rather than guess.
- Normalize exercise names to their common form (e.g. "bench" -> "Bench Press", "deads" -> "Deadlift") but don't merge two different exercises together.
- Resolve any date/time reference (e.g. "yesterday", "three days ago", "last Monday") against today's date into the top-level date field, in YYYY-MM-DD format. If nothing is said about when the workout happened, leave date null.
- Call the log_workout tool exactly once with the complete result.`;
}

export async function parseWorkoutTranscript(transcript: string): Promise<ParsedWorkout> {
  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    system: buildSystemPrompt(),
    tools: [LOG_WORKOUT_TOOL],
    tool_choice: { type: "tool", name: "log_workout" },
    messages: [{ role: "user", content: transcript }],
  });

  const toolUse = response.content.find((block) => block.type === "tool_use");
  if (!toolUse || toolUse.type !== "tool_use") {
    throw new Error("Claude did not return structured workout data");
  }

  const raw = toolUse.input as {
    date?: string | null;
    exercises: Array<{
      name: string;
      structure?: string;
      sets: Array<Record<string, unknown>>;
    }>;
    notes?: string | null;
  };

  const isValidIsoDate = (d: unknown): d is string =>
    typeof d === "string" && /^\d{4}-\d{2}-\d{2}$/.test(d);

  return {
    date: isValidIsoDate(raw.date) ? raw.date : todayDateOnlyString(),
    notes: raw.notes ?? null,
    exercises: raw.exercises.map((ex) => ({
      name: ex.name,
      structure: ex.structure === "total" ? "total" : "sets",
      sets: (ex.structure === "total" ? ex.sets.slice(0, 1) : ex.sets).map((s) => ({
        reps: (s.reps as number | null) ?? null,
        weight: (s.weight as number | null) ?? null,
        weightUnit: (s.weightUnit as "lb" | "kg" | undefined) ?? "lb",
        durationSeconds: (s.durationSeconds as number | null) ?? null,
        distance: (s.distance as number | null) ?? null,
        distanceUnit: (s.distanceUnit as string | null) ?? null,
        rpe: (s.rpe as number | null) ?? null,
        notes: (s.notes as string | null) ?? null,
      })),
    })),
  };
}
