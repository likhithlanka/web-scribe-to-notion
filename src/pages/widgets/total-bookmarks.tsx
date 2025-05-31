import { TotalBookmarksWidget } from "@/components/widgets/TotalBookmarksWidget";

export default function TotalBookmarksPage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md aspect-[3/2]">
        <TotalBookmarksWidget />
      </div>
    </div>
  );
}