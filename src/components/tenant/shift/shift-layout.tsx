import { ShiftsModule } from "./shift-module";
import type { Shift } from "@/src/application/interfaces/shift/shift";

interface ShiftLayoutProps {
  initialShifts: Shift[];
}

export default function ShiftLayout({ initialShifts }: ShiftLayoutProps) {
  return <ShiftsModule initialShifts={initialShifts} />;
}
