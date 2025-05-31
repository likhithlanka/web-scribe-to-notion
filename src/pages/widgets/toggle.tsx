import { ToggleWidget } from "@/components/widgets/ToggleWidget";

export default function TogglePage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center bg-[#F7F7F7] dark:bg-[#1F1F1F]">
      <div className="w-full max-w-[1400px] h-[600px]">
        <ToggleWidget />
      </div>
    </div>
  );
}