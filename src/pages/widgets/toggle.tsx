import { ToggleWidget } from "@/components/widgets/ToggleWidget";

export default function TogglePage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-[1400px]">
        <ToggleWidget />
      </div>
    </div>
  );
}