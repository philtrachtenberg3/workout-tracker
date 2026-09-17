import { RecordFlow } from "@/components/record-flow";

export default function Home() {
  return (
    <div className="flex flex-col">
      <header className="px-4 pt-8">
        <h1 className="text-2xl font-bold tracking-tight">Repper</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">Talk through your workout — I&apos;ll log it.</p>
      </header>
      <RecordFlow />
    </div>
  );
}
