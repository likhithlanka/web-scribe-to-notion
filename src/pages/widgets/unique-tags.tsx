import { UniqueTagsWidget } from "@/components/widgets/UniqueTagsWidget";

export default function UniqueTagsPage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-md h-[200px]">
        <UniqueTagsWidget />
      </div>
    </div>
  );
}