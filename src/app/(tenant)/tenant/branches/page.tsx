import { BranchHeader } from "@/src/components/tenant/branch/branch-header";
import { BranchLayout } from "@/src/components/tenant/branch/branch-layout";

export default function BranchesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <BranchHeader />
      <BranchLayout />
    </div>
  );
}
