import React from "react";
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
import { useReservationStore } from "@/src/store/useReservationStore";
import { usePriceCalculation } from "@/src/hooks/usePriceCalculation";
import { useClientCreditStore } from "@/src/store/useClientCreditStore";

interface ReservationModalProps {
  item: any;
  size: string;
  color: string;
  children: React.ReactNode;
  currentBranchId: string;
  originBranchId: string;
}

export function ReservationModal({
  item,
  size,
  color,
  children,
  currentBranchId,
  originBranchId,
}: ReservationModalProps) {
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [dateRange, setDateRange] = React.useState<any>(undefined);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");
  const [operationType, setOperationType] = React.useState<
    "venta" | "alquiler"
  >("alquiler");

  // Finanzas
  const [downPayment, setDownPayment] = React.useState("");
  const [guarantee, setGuarantee] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "card" | "transfer" | "yape" | "plin"
  >("cash");
  const [guaranteeType, setGuaranteeType] = React.useState<
    "dinero" | "dni" | "joyas" | "reloj" | "otros"
  >("dinero");

  const [keepAsCredit, setKeepAsCredit] = React.useState(false);
  const [amountPaid, setAmountPaid] = React.useState("");

  const scrollRef = useScrollIndicator();

  const sellerId = USER_MOCK[0].id;

  // Buscar stock físico exacto
  const exactStockItem = useInventoryStore((state) =>
    state.stock.find(
      (s) =>
        String(s.productId) === String(item.id) &&
        s.size === size &&
        s.color === color &&
        s.status === "disponible",
    ),
  );

  const balance = useClientCreditStore(
    (s) => s.getBalance(selectedCustomer?.id)
  );

  console.log("balance", balance);
  
  const stockId = exactStockItem?.id;
  const isAvailable = !!exactStockItem;

  const { days, totalOperacion, isVenta, isEvent } = usePriceCalculation({
    operationType,
    priceSell: item.price_sell,
    priceRent: item.price_rent,
    quantity,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    rentUnit: item.rent_unit,
    receivedAmount: Number(downPayment),
    guaranteeAmount: guaranteeType === "dinero" ? Number(guarantee) : 0,
  });

  // 💲 Precio unitario
  const unitPrice = isVenta ? item.price_sell || 0 : item.price_rent || 0;

  const { createReservation } = useReservationStore();

  const handleConfirm = () => {
    if (!selectedCustomer || !dateRange?.from) {
      toast.error("Faltan datos obligatorios (Fecha o Cliente)");
      return;
    }

    if (!isAvailable || !stockId) {
      toast.error("Stock no disponible");
      return;
    }

    const newReservation: ReservationDTO = {
      branchId: currentBranchId,
      productId: item.id,
      productName: item.name,
      sku: item.sku,
      createdAt: new Date(),
      size,
      color,
      type: "reserva",
      operationType,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      quantity,
      status: "confirmada",
      notes,
      financials: {
        receivedAmount: Number(amountPaid),
        keepAsCredit,
        totalPrice: totalOperacion,
        downPayment: Number(downPayment),
        paymentMethod,
        pendingAmount: totalOperacion - Number(downPayment),
      },
      stockId,
      sellerId,
      reservationDateRange: {
        from: dateRange.from || new Date(),
        to: dateRange.to,
      },
      id: "",
      operationId: "",
    };

    try {
      processTransaction(newReservation);
      createReservation(newReservation);
      toast.success(
        operationType === "venta"
          ? "Venta registrada correctamente"
          : "Reserva creada con éxito",
      );
    } catch (err) {
      console.error(err);
      toast.error("Error al crear la operación");
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>

      <DialogContent className="max-w-lg max-h-dvh sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="uppercase text-sm font-black">
            {operationType === "alquiler" ? (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
                Reserva de Alquiler
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} />
                Separación de Venta
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto py-4 pr-1"
        >
          <ReservationFormContent
            item={item}
            size={size}
            color={color}
            originBranchId={originBranchId}
            currentBranchId={currentBranchId}
            dateRange={dateRange}
            setDateRange={setDateRange}
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
            guarantee={guarantee}
            setGuarantee={setGuarantee}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            guaranteeType={guaranteeType}
            setGuaranteeType={setGuaranteeType}
            notes={notes}
            setNotes={setNotes}
            operationType={operationType}
            setOperationType={setOperationType}
          />
        </div>

        <div className="pt-4 border-t">
          {!isAvailable ? (
            <Button disabled className="w-full h-12 bg-red-600 font-bold">
              Stock no disponible
            </Button>
          ) : (
            <Button
              onClick={handleConfirm}
              className={`w-full h-12 font-bold ${
                isVenta ? "bg-orange-600" : "bg-emerald-600"
              }`}
            >
              Confirmar {isVenta ? "Venta" : "Reserva"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
