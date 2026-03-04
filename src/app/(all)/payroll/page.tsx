import { PayrollHeader } from "@/src/components/payroll/payroll-header";
import { PayrollLayout } from "@/src/components/payroll/payroll-layout";

export default function PayrollPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <PayrollHeader />
        <PayrollLayout />
      </div>
    </>
  );
}
