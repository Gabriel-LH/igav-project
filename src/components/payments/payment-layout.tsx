import { PaymentDataTable } from "./payment-data-table";

export function PaymentLayout() {
  const dataPaymentCompleted = [];
  const dataPaymentPending = [];
  const dataPaymentRefund = [];
  const dataPaymentCanceled = [];
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col md:gap-4 md:py-4">
          <PaymentDataTable
            dataPaymentCompleted={dataPaymentCompleted}
            dataPaymentPending={dataPaymentPending}
            dataPaymentRefund={dataPaymentRefund}
            dataPaymentCanceled={dataPaymentCanceled}
          />
        </div>
      </div>
    </div>
  );
}
