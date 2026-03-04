import { ShiftHeader } from "@/src/components/shift/shift-header";
import ShiftLayout from "@/src/components/shift/shift-layout";

export default function ShiftsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <ShiftHeader />
      <ShiftLayout />
    </div>
  );
}
