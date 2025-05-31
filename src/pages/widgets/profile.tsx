import { ProfileWidget } from "@/components/widgets/ProfileWidget";

export default function ProfilePage() {
  return (
    <div className="min-h-screen w-screen p-4 flex items-center justify-center">
      <div className="w-full max-w-md h-[300px]">
        <ProfileWidget />
      </div>
    </div>
  );
}