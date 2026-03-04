import { AttendanceHeader } from "@/src/components/attendance/attendance-header";
import { AttendanceLayout } from "@/src/components/attendance/attendance-layout";

export default function AttendancePage() {
  return (
     <div className="flex flex-col gap-6 p-6">
      <AttendanceHeader />
      <AttendanceLayout />
    </div>
  );
}