import { PosHeader } from "@/src/components/pos/pos-header";
import { PosLayout } from "@/src/components/pos/pos-layout";

export default function PosPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <PosHeader />

        <PosLayout />
      </div>
    </>
  );
}
