import { PaymentHeader } from "@/src/components/payments/payment-header";
import { PaymentLayout } from "@/src/components/payments/payment-layout";

export default function PaymentPage() {
  return (
    <>
      <div className="flex flex-col gap-6 p-6">
        <PaymentHeader />
        <PaymentLayout />
      </div>
    </>
  );
}
