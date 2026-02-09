import { formatCurrency } from "@/src/utils/currency-format";
import { usePriceCalculation } from "@/src/hooks/usePriceCalculation";
import { PriceBreakdownBase } from "@/src/components/pricing/PriceBreakdownBase";
import { cn } from "@/lib/utils";
import { ReservationPaymentSummary } from "./ReservationPaymentSummary";

export function PriceSummary({
  item,
  startDate,
  endDate,
  operationType,
  priceRent,
  quantity,
  amountPaid,
  setAmountPaid,
  keepAsCredit,
  setKeepAsCredit,
  guarantee,
  guaranteeType,
  downPayment,
  setDownPayment,
  paymentMethod,
  setPaymentMethod,
}: any) {
  const { isVenta, isEvent, days, totalOperacion, totalHoy, pending } =
    usePriceCalculation({
      operationType,
      priceSell: item.price_sell,
      priceRent,
      quantity,
      startDate,
      endDate,
      rentUnit: item.rent_unit,
      receivedAmount: Number(downPayment) || 0,
      guaranteeAmount: guaranteeType === "dinero" ? Number(guarantee) || 0 : 0,
    });

  return (
    <div className="space-y-4">
      <PriceBreakdownBase
        unitPrice={priceRent}
        quantity={quantity}
        days={!isVenta ? days : undefined}
        isEvent={isEvent}
        total={totalOperacion}
      />

      <ReservationPaymentSummary
        amountPaid={amountPaid}
        setAmountPaid={setAmountPaid}
        keepAsCredit={keepAsCredit}
        setKeepAsCredit={setKeepAsCredit}
        downPayment={downPayment}
        setDownPayment={setDownPayment}
        paymentMethod={paymentMethod}
        setPaymentMethod={setPaymentMethod}
      />
      <div className="p-3 border rounded-lg bg-muted/30">
        <div className="flex justify-between text-xs">
          <span>Saldo pendiente</span>
          <span
            className={cn(
              "font-bold",
              pending > 0 ? "text-red-400" : "text-emerald-400",
            )}
          >
            {formatCurrency(pending)}
          </span>
        </div>

        <div className="flex justify-between pt-2 border-t mt-2">
          <span className="text-sm font-bold">Total hoy</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(totalHoy)}
          </span>
        </div>
      </div>
    </div>
  );
}
