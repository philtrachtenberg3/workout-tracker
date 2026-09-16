# Repper

A voice-first workout tracker. Talk through your workout out loud, tap to stop, and it's transcribed and logged automatically. Ask natural-language questions about your training history ("what did I do last week?", "how much have I benched the past 5 times?").

## How it works

1. **Record** — tap the mic, talk through your workout for as long as you want, tap again to stop.
2. **Transcribe** — your recording is sent to OpenAI's `gpt-4o-transcribe` for high-accuracy transcription.
3. **Parse** — the transcript is sent to Claude, which extracts structured exercises/sets/reps/weight.
4. **Review** — you get an editable summary to fix anything before saving.
5. **Ask** — ask questions about your history; Claude looks up your actual logged data (via a couple of read-only tools) before answering.

Everything is stored locally in a SQLite database (`prisma/dev.db`).

## Setup

1. Install dependencies (requires **Node 20+** — this repo pins it via `.nvmrc`):
   ```bash
   nvm use
   npm install
   ```
2. Copy the env template and add your own API keys:
   ```bash
   cp .env.local.example .env
   ```
   Then edit `.env` and set:
   - `OPENAI_API_KEY` — from [platform.openai.com](https://platform.openai.com/api-keys). Used for transcription (`gpt-4o-transcribe`); billed per minute of audio (~$0.006/min).
   - `ANTHROPIC_API_KEY` — from [console.anthropic.com](https://console.anthropic.com/settings/keys). Used to parse transcripts into structured workouts and to answer questions about your history.

   (A `.env` with placeholder keys already exists from initial setup — just replace the placeholder values.)
3. The database is already created and migrated. If you ever reset it or change `prisma/schema.prisma`, run:
   ```bash
   npx prisma migrate dev
   ```
4. Run the app:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Recording requires microphone permission in the browser.

## Notes

- This is set up for **local use only** — no auth, no hosting. Your data lives in `prisma/dev.db` on your machine.
- The record → review flow always shows you the parsed sets before saving, so you can fix any misheard numbers.
- `/ask` only ever reads your logged data through two fixed lookup tools (by date range, or by exercise name) — it can't invent numbers or run arbitrary queries.
