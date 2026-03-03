import { TeamHeader } from "@/src/components/team/team-header";
import { TeamLayout } from "@/src/components/team/team-layout";

export default function TeamPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <TeamHeader />
      <TeamLayout />
    </div>
  );
}
