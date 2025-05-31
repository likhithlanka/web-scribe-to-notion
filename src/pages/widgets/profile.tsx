import { ProfileWidget } from "@/components/widgets/ProfileWidget";

export default function ProfilePage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-4xl h-48">
        <ProfileWidget />
      </div>
    </div>
  );
}