import { TopicWidget } from "@/components/widgets/TopicWidget";

export default function TopicPage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-md aspect-[3/2]">
        <TopicWidget />
      </div>
    </div>
  );
}