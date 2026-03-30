
import { PosLayout } from "@/src/components/tenant/pos/pos-layout";

export default function PosPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-2 h-[calc(100vh-var(--header-height))] overflow-hidden">


        <div className="flex-1 min-h-0 overflow-hidden">
          <PosLayout />
        </div>
      </div>
    </>
  );
}
