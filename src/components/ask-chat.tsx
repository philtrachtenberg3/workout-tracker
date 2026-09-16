"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "What did I do last week?",
  "How much have I benched the past 5 times?",
  "How has my squat progressed this month?",
];

export function AskChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function ask(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "Something went wrong answering that — try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-4 px-4 pb-4">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          ask(input);
        }}
        className="flex items-end gap-2"
      >
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              ask(input);
            }
          }}
          placeholder="Ask about your workouts…"
          rows={1}
          className="max-h-32 min-h-9 flex-1 resize-none"
        />
        <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Ask">
          <Send className="size-4" />
        </Button>
      </form>

      {messages.length === 0 && (
        <div className="flex flex-col gap-2">
          <p className="text-sm text-muted-foreground">Try asking:</p>
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => ask(s)}
              className="rounded-lg border border-border px-3 py-2 text-left text-sm hover:bg-muted"
            >
              {s}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m, i) => (
          <div
            key={i}
            className={cn(
              "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap",
              m.role === "user"
                ? "ml-auto bg-primary text-primary-foreground"
                : "mr-auto bg-muted text-foreground",
            )}
          >
            {m.content}
          </div>
        ))}
        {loading && (
          <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-3.5 py-2 text-sm text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Thinking…
          </div>
        )}
      </div>
      <div ref={scrollRef} />
    </div>
  );
}
