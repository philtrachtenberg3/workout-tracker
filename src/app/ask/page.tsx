import { AskChat } from "@/components/ask-chat";

export default function AskPage() {
  return (
    <div className="flex flex-col">
      <header className="px-4 pt-6 pb-4">
        <h1 className="text-xl font-bold">Ask</h1>
        <p className="text-sm text-muted-foreground">Ask about your training history.</p>
      </header>
      <AskChat />
    </div>
  );
}
