"use client";

import { mapPaymentsToTable } from "@/src/adapters/payment-adapter";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useOperationStore } from "@/src/store/useOperationStore";
import { usePaymentStore } from "@/src/store/usePaymentStore";
import { PaymentDataTable } from "./payment-data-table";

export function PaymentLayout() {
  const { payments } = usePaymentStore();
  const { customers } = useCustomerStore();
  const { operations } = useOperationStore();
  const users = USER_MOCK;


  const dataPaymentCompleted = mapPaymentsToTable(
    payments.filter((p) => p.status === "posted" && p.category === "payment"),
    payments,
    customers,
    operations,
    users,
  );

  const dataPaymentPending = mapPaymentsToTable(
    payments.filter((p) => p.status === "pending"),
    payments,
    customers,
    operations,
    users,
  );

  const dataPaymentRefund = mapPaymentsToTable(
    payments.filter((p) => p.status === "posted" && p.category === "refund"),
    payments,
    customers,
    operations,
    users,
  );

  const dataPaymentCorrections = mapPaymentsToTable(
    payments.filter(
      (p) => p.status === "posted" && p.category === "correction",
    ),
    payments,
    customers,
    operations,
    users,
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col md:gap-4 md:py-4">
          <PaymentDataTable
            dataPaymentCompleted={dataPaymentCompleted}
            dataPaymentPending={dataPaymentPending}
            dataPaymentRefund={dataPaymentRefund}
            dataPaymentCorrections={dataPaymentCorrections}
          />
        </div>
      </div>
    </div>
  );
}
