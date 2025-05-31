import { TopicWidget } from "@/components/widgets/TopicWidget";

export default function TopicPage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-md h-[200px]">
        <TopicWidget />
      </div>
    </div>
  );
}