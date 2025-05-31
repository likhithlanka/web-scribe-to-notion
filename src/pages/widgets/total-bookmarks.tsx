import { TotalBookmarksWidget } from "@/components/widgets/TotalBookmarksWidget";

export default function TotalBookmarksPage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-md h-[200px]">
        <TotalBookmarksWidget />
      </div>
    </div>
  );
}