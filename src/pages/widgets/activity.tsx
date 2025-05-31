import { ActivityWidget } from "@/components/widgets/ActivityWidget";

export default function ActivityPage() {
  return (
    <div className="min-h-screen w-screen p-2 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[1200px]">
        <ActivityWidget />
      </div>
    </div>
  );
}