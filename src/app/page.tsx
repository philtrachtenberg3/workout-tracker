import { RecordFlow } from "@/components/record-flow";

export default function Home() {
  return (
    <div className="flex flex-col">
      <header className="px-4 pt-6">
        <h1 className="text-xl font-bold">Repper</h1>
        <p className="text-sm text-muted-foreground">Talk through your workout — I&apos;ll log it.</p>
      </header>
      <RecordFlow />
    </div>
  );
}
