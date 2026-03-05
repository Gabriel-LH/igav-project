import { ReturnGrid } from "@/src/components/tenant/return/return-grid";
import { ReturnHeader } from "@/src/components/tenant/return/return-header";

export default function ReturnsPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <ReturnHeader />
        <ReturnGrid />
      </div>
    </>
  );
}
