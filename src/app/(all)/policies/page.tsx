import { PolicyHeader } from "@/src/components/policies/policy-header";
import { PolicyLayout } from "@/src/components/policies/policy-layout";

export default function PoliciesPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PolicyHeader />
      <PolicyLayout />
    </div>
  );
}
