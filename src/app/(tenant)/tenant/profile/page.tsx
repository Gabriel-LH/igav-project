import { ProfileHeader } from "@/src/components/tenant/profile/profile-header";
import { ProfileLayout } from "@/src/components/tenant/profile/profile-layout";

export default function ProfilePage() {
    return (
        <div className="flex flex-col gap-6 p-6">
            <ProfileHeader/>
            <ProfileLayout/>
        </div>
    )
}
