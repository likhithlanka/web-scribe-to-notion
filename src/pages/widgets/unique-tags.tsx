import { UniqueTagsWidget } from "@/components/widgets/UniqueTagsWidget";

export default function UniqueTagsPage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md aspect-[3/2]">
        <UniqueTagsWidget />
      </div>
    </div>
  );
}