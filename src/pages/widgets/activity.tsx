import { ActivityWidget } from "@/components/widgets/ActivityWidget";

export default function ActivityPage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-2xl h-[300px]">
        <ActivityWidget />
      </div>
    </div>
  );
}