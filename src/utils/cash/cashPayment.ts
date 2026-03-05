// components/cash/payment-utils.ts
import { Payment } from "@/src/types/payments/type.payments";

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

export const getPeriodLabel = (preset: PaymentDatePreset) => {
  if (preset === "today") return "hoy";
  if (preset === "yesterday") return "ayer";
  if (preset === "custom") return "rango personalizado";

  const daysAgo = Number(preset.replace("days_", ""));
  return `hace ${daysAgo} dias`;
};

export const filterPaymentsByDate = (
  payments: Payment[],
  preset: PaymentDatePreset,
  customFrom: Date,
  customTo: Date,
) => {
  if (preset === "custom") {
    const fromDate = customFrom ? startOfDay(customFrom) : null;
    const toDate = customTo ? endOfDay(customTo) : null;

    return payments.filter((payment) => {
      const paymentDate = new Date(payment.date);
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
    (payment) => new Date(payment.date) >= from && new Date(payment.date) <= to,
  );
};
