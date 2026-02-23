"use client";

import { mapPaymentsToTable } from "@/src/adapters/payment-adapter";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useOperationStore } from "@/src/store/useOperationStore";
import { usePaymentStore } from "@/src/store/usePaymentStore";
import { Payment } from "@/src/types/payments/type.payments";
import { useMemo, useState } from "react";
import { PaymentDataTable } from "./payment-data-table";
import { PaymentHeader } from "./payment-header";

export type PaymentDatePreset =
  | "today"
  | "yesterday"
  | "days_2"
  | "days_3"
  | "days_4"
  | "days_5"
  | "days_6"
  | "days_7"
  | "custom";

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);

const endOfDay = (date: Date) =>
  new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    23,
    59,
    59,
    999,
  );

const getOffsetFromPreset = (preset: Exclude<PaymentDatePreset, "custom">) => {
  if (preset === "today") return 0;
  if (preset === "yesterday") return 1;
  return Number(preset.replace("days_", ""));
};

const getPeriodLabel = (preset: PaymentDatePreset) => {
  if (preset === "today") return "hoy";
  if (preset === "yesterday") return "ayer";
  if (preset === "custom") return "rango personalizado";

  const daysAgo = Number(preset.replace("days_", ""));
  return `hace ${daysAgo} dias`;
};

const filterPaymentsByDate = (
  payments: Payment[],
  preset: PaymentDatePreset,
  customFrom: Date,
  customTo: Date,
) => {
  if (preset === "custom") {
    const fromDate = customFrom ? startOfDay(customFrom) : null;
    const toDate = customTo ? endOfDay(customTo) : null;

    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date); // si payment.date es string
      const afterFrom = fromDate ? paymentDate >= fromDate : true;
      const beforeTo = toDate ? paymentDate <= toDate : true;
      return afterFrom && beforeTo;
    });
  }
  const offset = getOffsetFromPreset(preset);
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() - offset);

  const from = startOfDay(targetDate);
  const to = endOfDay(targetDate);

  return payments.filter(
    (payment) => payment.date >= from && payment.date <= to,
  );
};

export function PaymentLayout() {
  const { payments } = usePaymentStore();
  const { customers } = useCustomerStore();
  const { operations } = useOperationStore();
  const users = USER_MOCK;

  const [datePreset, setDatePreset] = useState<PaymentDatePreset>("today");
  const [customFrom, setCustomFrom] = useState<Date>(new Date());
  const [customTo, setCustomTo] = useState<Date>(new Date());

  const filteredPayments = useMemo(
    () => filterPaymentsByDate(payments, datePreset, customFrom, customTo),
    [payments, datePreset, customFrom, customTo],
  );

  const data = useMemo(
    () => mapPaymentsToTable(filteredPayments, customers, operations, users),
    [filteredPayments, customers, operations, users],
  );

  const periodLabel = useMemo(() => getPeriodLabel(datePreset), [datePreset]);

  return (
    <div className="flex flex-1 flex-col gap-6">
      <PaymentHeader payments={filteredPayments} periodLabel={periodLabel} />

      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col md:gap-4 md:py-4">
          <PaymentDataTable
            data={data}
            datePreset={datePreset}
            onDatePresetChange={setDatePreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />
        </div>
      </div>
    </div>
  );
}
