import { BranchHeader } from "@/src/components/branch/branch-header";
import { BranchLayout } from "@/src/components/branch/branch-layout";

export default function BranchesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <BranchHeader />
      <BranchLayout />
    </div>
  );
}
