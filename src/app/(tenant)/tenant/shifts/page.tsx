import { ShiftHeader } from "@/src/components/tenant/shift/shift-header";
import ShiftLayout from "@/src/components/tenant/shift/shift-layout";
import { getShiftsAction } from "@/src/app/(tenant)/tenant/actions/shift.actions";

export default async function ShiftsPage() {
  const initialShifts = await getShiftsAction();
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <ShiftHeader />
      <ShiftLayout initialShifts={initialShifts} />
    </div>
  );
}
