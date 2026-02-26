import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ReservationFormContent } from "./ReservationFormContent";
import { toast } from "sonner";
import { Calendar02Icon, ShoppingBag01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useScrollIndicator } from "@/src/utils/scroll/useScrollIndicator";
import { ReservationDTO } from "@/src/interfaces/ReservationDTO";
import { processTransaction } from "@/src/services/transactionServices";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { usePriceCalculation } from "@/src/hooks/usePriceCalculation";
import { useClientCreditStore } from "@/src/store/useClientCreditStore";
import { DialogDescription } from "@radix-ui/react-dialog";
import { PaymentMethodType } from "@/src/utils/status-type/PaymentMethodType";
import { OperationType } from "@/src/utils/status-type/OperationType";
import {
  getAvailabilityByAttributes,
  getTotalStock,
} from "@/src/utils/reservation/checkAvailability";
import { endOfDay, startOfDay } from "date-fns";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import z from "zod";
import { productSchema } from "@/src/types/product/type.product";
import { formatCurrency } from "@/src/utils/currency-format";

interface ReservationModalProps {
  item: z.infer<typeof productSchema>;
  sizeId: string;
  colorId: string;
  children: React.ReactNode;
  currentBranchId: string;
  originBranchId: string;
  onSuccess: () => void;
}

export function ReservationModal({
  item,
  sizeId,
  colorId,
  children,
  currentBranchId,
  originBranchId,
  onSuccess,
}: ReservationModalProps) {
  const [open, setOpen] = React.useState(false);

  const businessRules = BUSINESS_RULES_MOCK;

  const [assignedStockIds, setAssignedStockIds] = React.useState<string[]>([]);

  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [dateRange, setDateRange] = React.useState<any>(undefined);
  const [pickupTime, setPickupTime] = React.useState<string>(
    businessRules.openHours.open,
  );
  const [returnTime, setReturnTime] = React.useState<string>(
    businessRules.openHours.close,
  );
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");
  const [operationType, setOperationType] = React.useState<
    "venta" | "alquiler"
  >("alquiler");

  // Finanzas
  const [downPayment, setDownPayment] = React.useState("");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethodType>("cash");

  const [keepAsCredit, setKeepAsCredit] = React.useState(false);
  const [amountPaid, setAmountPaid] = React.useState("");

  const [useCredit, setUseCredit] = React.useState(false);

  const scrollRef = useScrollIndicator();

  const sellerId = USER_MOCK[0].id;

  const { inventoryItems, stockLots } = useInventoryStore();

  // Buscar stock físico exacto
  const validStockCandidates = useMemo(() => {
    const productId = String(item.id);

    if (item.is_serial) {
      return inventoryItems.filter((s) => {
        const isBaseMatch =
          String(s.productId) === productId &&
          s.sizeId === sizeId &&
          s.colorId === colorId;

        if (!isBaseMatch) return false;

        if (operationType === "venta") {
          return s.isForSale === true && s.status === "disponible";
        } else {
          return s.isForRent === true;
        }
      });
    } else {
      return stockLots.filter((s) => {
        const isBaseMatch =
          String(s.productId) === productId &&
          s.sizeId === sizeId &&
          s.colorId === colorId;

        if (!isBaseMatch) return false;

        if (operationType === "venta") {
          return s.isForSale === true && s.status === "disponible";
        } else {
          return (
            s.isForRent === true &&
            (s.status as any) !== "vendido" &&
            (s.status as any) !== "vendido_pendiente_entrega" &&
            (s as any).quantity > 0
          );
        }
      });
    }
  }, [
    inventoryItems,
    stockLots,
    item.id,
    item.is_serial,
    sizeId,
    colorId,
    operationType,
  ]);

  // 2. STOCK FÍSICO TOTAL
  const totalPhysicalStock = useMemo(() => {
    return getTotalStock(item.id, sizeId, colorId, operationType);
  }, [item.id, sizeId, colorId, operationType]);

  // 2. STOCK DISPONIBLE EN FECHAS
  const availableInDates = useMemo(() => {
    if (!dateRange?.from || !dateRange?.to) return totalPhysicalStock;

    const check = getAvailabilityByAttributes(
      item.id,
      sizeId,
      colorId,
      dateRange.from,
      dateRange.to,
      operationType,
    );

    return check.availableCount;
  }, [item.id, sizeId, colorId, dateRange, operationType, totalPhysicalStock]);

  const stockCount = useMemo(
    () =>
      validStockCandidates.reduce(
        (acc, curr: any) => acc + (curr.quantity ?? 1),
        0,
      ),
    [validStockCandidates],
  );

  const hasStock = stockCount >= quantity;

  const balance = useClientCreditStore((s) =>
    s.getBalance(selectedCustomer?.id),
  );

  const { days, subtotal, creditApplied, totalOperacion, isVenta, isEvent } =
    usePriceCalculation({
      operationType,
      priceSell: item.price_sell,
      priceRent: item.price_rent,
      quantity,
      startDate: dateRange?.from,
      endDate: dateRange?.to,
      rentUnit: item?.rent_unit,
      receivedAmount: Number(downPayment),
      availableCredit: balance,
      useCredit: keepAsCredit,
    });

  const unitPrice = isVenta ? item.price_sell || 0 : item.price_rent || 0;

  React.useEffect(() => {
    if (open) {
      const hasRentStock = validStockCandidates.some((s: any) => s.isForRent);
      const hasSaleStock = validStockCandidates.some((s: any) => s.isForSale);

      if (hasRentStock && !hasSaleStock) {
        setOperationType("alquiler");
      } else if (!hasRentStock && hasSaleStock) {
        setOperationType("venta");
      }
    }
  }, [open, validStockCandidates]);

  const realPaidAmount = Number(amountPaid) || Number(downPayment);
  const overpayment =
    realPaidAmount > totalOperacion ? realPaidAmount - totalOperacion : 0;

  const handleConfirm = () => {
    if (!selectedCustomer || !dateRange?.from) {
      return toast.error("Faltan datos obligatorios (Fecha o Cliente)");
    }

    if (operationType === "alquiler") {
      if (quantity > availableInDates) {
        return toast.error(
          `Solo hay ${availableInDates} unidades disponibles para esas fechas.`,
        );
      }
    } else {
      if (!hasStock) {
        return toast.error(`Stock insuficiente para realizar la venta.`);
      }
    }

    let transactionItems: any[] = [];

    if (operationType === "venta") {
      if (item.is_serial) {
        if (assignedStockIds.length !== quantity) {
          return toast.error(
            `Venta: Debes asignar las ${quantity} prendas físicas exactas para retirar.`,
          );
        }
        transactionItems = assignedStockIds.map((code) => ({
          productId: item.id,
          productName: item.name,
          sizeId,
          colorId,
          quantity: 1,
          priceAtMoment: unitPrice,
          stockId: code,
        }));
      } else {
        // CASO NO SERIALIZADO (Lotes): Tomamos automáticamente del stock disponible (FIFO)
        let remainingQty = quantity;
        for (const stockItem of validStockCandidates as any[]) {
          if (remainingQty <= 0) break;
          const take = Math.min(remainingQty, stockItem.quantity);

          transactionItems.push({
            productId: item.id,
            productName: item.name,
            sizeId: sizeId,
            colorId: colorId,
            quantity: take,
            priceAtMoment: unitPrice,
            stockId: stockItem.variantCode,
          });
          remainingQty -= take;
        }
      }
    } else {
      for (let i = 0; i < quantity; i++) {
        transactionItems.push({
          productId: item.id,
          productName: item.name,
          sizeId: sizeId,
          colorId: colorId,
          quantity: 1,
          priceAtMoment: unitPrice,
          stockId: undefined,
        });
      }
    }

    const newReservation: ReservationDTO = {
      branchId: currentBranchId,
      createdAt: new Date(),
      type: "reserva",
      operationType,
      customerId: selectedCustomer.id,
      status: "confirmada",
      notes,
      financials: {
        receivedAmount: realPaidAmount,
        keepAsCredit,
        totalPrice: totalOperacion,
        downPayment: Number(downPayment),
        paymentMethod,
        pendingAmount: Math.max(totalOperacion - Number(downPayment), 0),
      } as any,
      sellerId,
      reservationDateRange: {
        from: startOfDay(dateRange.from) || new Date(),
        to: endOfDay(dateRange.to || dateRange.from),
        hourFrom: pickupTime,
      },
      id: "",
      operationId: "",
      items: transactionItems,
      updatedAt: new Date(),
    };

    try {
      processTransaction(newReservation);

      if (overpayment > 0 && !keepAsCredit) {
        toast.info(
          `Operación exitosa. Se entregó ${formatCurrency(overpayment)} de vuelto.`,
        );
      } else if (overpayment > 0 && keepAsCredit) {
        toast.success(
          `Operación exitosa. ${formatCurrency(overpayment)} guardados como crédito.`,
        );
      } else {
        toast.success(
          operationType === "venta"
            ? "Venta registrada correctamente"
            : "Reserva de alquiler creada con éxito",
        );
      }
    } catch (err) {
      console.error(err);
      toast.error("Error al crear la operación");
    }
    setOpen(false);
    onSuccess();
  };

  return (
    <Dialog
      aria-hidden={open ? "false" : "true"}
      open={open}
      onOpenChange={setOpen}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-lg max-h-dvh sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="uppercase text-sm font-black">
            {operationType === "alquiler" ? (
              <span className="flex items-center gap-2 text-blue-500">
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
                Reserva de Alquiler
              </span>
            ) : (
              <span className="flex items-center gap-2 text-orange-500">
                <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} />
                Reserva de Venta
              </span>
            )}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Completa el formulario para crear una reserva o separación
          </DialogDescription>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto py-4 pr-1"
        >
          <ReservationFormContent
            item={item}
            sizeId={sizeId}
            colorId={colorId}
            originBranchId={originBranchId}
            currentBranchId={currentBranchId}
            dateRange={dateRange}
            setDateRange={setDateRange}
            pickupTime={pickupTime}
            setPickupTime={setPickupTime}
            returnTime={returnTime}
            setReturnTime={setReturnTime}
            selectedCustomer={selectedCustomer}
            setSelectedCustomer={setSelectedCustomer}
            quantity={quantity}
            setQuantity={setQuantity}
            unitPrice={unitPrice}
            days={days}
            isEvent={isEvent}
            totalOperacion={totalOperacion}
            downPayment={downPayment}
            setDownPayment={setDownPayment}
            amountPaid={amountPaid}
            setAmountPaid={setAmountPaid}
            keepAsCredit={keepAsCredit}
            setKeepAsCredit={setKeepAsCredit}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            notes={notes}
            setNotes={setNotes}
            operationType={operationType}
            setOperationType={setOperationType}
            maxStock={
              dateRange?.from && dateRange?.to
                ? availableInDates
                : totalPhysicalStock
            }
            setAssignedStockIds={setAssignedStockIds}
            useCredit={useCredit}
            setUseCredit={setUseCredit}
            balance={balance}
          />
        </div>

        <div className="pt-4 border-t">
          {!hasStock ? (
            <Button disabled className="w-full h-12 bg-red-600 font-bold">
              Stock no disponible
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              className={`w-full h-12 font-bold ${
                !isVenta
                  ? "text-white bg-linear-to-r  from-blue-500 via-blue-600 to-blue-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
                  : "text-white bg-linear-to-r from-orange-500 via-orange-600 to-orange-700 hover:bg-linear-to-br focus:ring-4 focus:outline-none focus:ring-orange-300 dark:focus:ring-orange-800 rounded-base text-sm px-4 py-2.5 text-center leading-5"
              }`}
            >
              RESERVAR
              {isVenta ? " VENTA" : " ALQUILER"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
