import { AskChat } from "@/components/ask-chat";

export default function AskPage() {
  return (
    <div className="flex flex-col">
      <header className="px-4 pt-8 pb-4">
        <h1 className="text-2xl font-bold tracking-tight">Ask</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Ask about your training history.</p>
      </header>
      <AskChat />
    </div>
  );
}
