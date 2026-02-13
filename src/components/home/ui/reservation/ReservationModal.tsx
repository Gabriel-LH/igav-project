import React, { useEffect, useMemo } from "react";
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
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { PaymentMethodType } from "@/src/utils/status-type/PaymentMethodType";
import { OperationType } from "@/src/utils/status-type/OperationType";
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";
import { endOfDay, startOfDay } from "date-fns";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import z from "zod";
import { productSchema } from "@/src/types/product/type.product";

interface ReservationModalProps {
  item: z.infer<typeof productSchema>;
  size: string;
  color: string;
  children: React.ReactNode;
  currentBranchId: string;
  originBranchId: string;
  onSuccess: () => void;
}

export function ReservationModal({
  item,
  size,
  color,
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
  const [operationType, setOperationType] =
    React.useState<OperationType>("alquiler");

  // Finanzas
  const [downPayment, setDownPayment] = React.useState("");
  const [guarantee, setGuarantee] = React.useState("");
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethodType>("cash");
  const [guaranteeType, setGuaranteeType] =
    React.useState<GuaranteeType>("dinero");

  const [keepAsCredit, setKeepAsCredit] = React.useState(false);
  const [amountPaid, setAmountPaid] = React.useState("");

  const scrollRef = useScrollIndicator();

  const sellerId = USER_MOCK[0].id;

  const allStock = useInventoryStore((state) => state.stock);

  // Buscar stock físico exacto
  const validStockCandidates = useMemo(() => {
    return allStock.filter((s) => {
      // A. Filtros base de coincidencia física
      const isBaseMatch =
        String(s.productId) === String(item.id) &&
        s.size === size &&
        s.color === color;

      if (!isBaseMatch) return false;

      // B. Filtro por Propósito (Regla de Negocio)
      if (operationType === "venta") {
        // PARA VENTA: Debe ser para venta Y estar físicamente disponible hoy
        return s.isForSale === true && s.status === "disponible";
      } else {
        // PARA ALQUILER:
        // Debe ser para alquiler.
        // Y debe EXISTIR (no estar vendido, ni dado de baja).
        // NO IMPORTA si está "alquilado", "en_lavanderia" o "reservado_fisico" ahora mismo,
        // porque la validación de fechas se encargará de ver si choca.
        return (
          s.isForRent === true &&
          s.status !== "vendido" &&
          s.status !== "baja" &&
          s.status !== "vendido_pendiente_entrega" && // Ya se vendió, solo esperan recogerlo
          s.status !== "agotado"
        );
      }
    });
  }, [allStock, item.id, size, color, operationType]);

  const totalPhysicalStock = useMemo(() => {
    return allStock.filter((s) => {
      const isBaseMatch =
        String(s.productId) === String(item.id) &&
        s.size === size &&
        s.color === color;

      // Filtro importante que ya discutimos (Venta vs Alquiler)
      if (operationType === "venta") {
        return s.isForSale === true && s.status === "disponible";
      } else {
        return (
          s.isForRent === true && s.status !== "baja" && s.status !== "vendido"
        );
      }
    }).length;
  }, [allStock, item.id, size, color, operationType]);

  // 2. STOCK DISPONIBLE EN FECHAS (Dinámico)
  // Esto dice: "Para las fechas que elegiste, ¿cuántos quedan?"
  const availableInDates = useMemo(() => {
    // Si no hay fechas seleccionadas, el límite es el total físico
    if (!dateRange?.from || !dateRange?.to) return totalPhysicalStock;

    // Si hay fechas, preguntamos al oráculo (tu helper)
    const check = getAvailabilityByAttributes(
      item.id,
      size,
      color,
      dateRange.from,
      dateRange.to,
      operationType, // "alquiler"
    );

    // El helper nos devuelve 'availableCount'. Ese es nuestro nuevo máximo.
    return check.availableCount;
  }, [item.id, size, color, dateRange, operationType, totalPhysicalStock]);

  // 3. VALIDACIÓN DE CANTIDAD SELECCIONADA
  // Si el usuario tenía puesto "3" y cambia las fechas a unas donde solo hay "2",
  // debemos avisarle o corregirlo.
  useEffect(() => {
    if (quantity > Number(availableInDates)) {
      toast.warning(
        `Solo hay ${availableInDates} unidades disponibles para esas fechas.`,
      );
      setQuantity(Number(availableInDates) > 0 ? Number(availableInDates) : 1); // Ajuste automático
    }
  }, [availableInDates, quantity]);

  const selectedStockId = validStockCandidates[0]?.id;

  const stockCount = validStockCandidates.length;

  const hasStock = stockCount >= quantity;

  const availabilityCheck = getAvailabilityByAttributes(
    item.id,
    size,
    color,
    dateRange?.from,
    dateRange?.to,
    operationType,
  );

  const hasStockForType = useInventoryStore
    .getState()
    .stock.some(
      (s) =>
        s.productId === item.id &&
        s.size === size &&
        s.color === color &&
        s.status === "disponible" &&
        (operationType === "venta" ? s.isForSale : s.isForRent),
    );

  const balance = useClientCreditStore((s) =>
    s.getBalance(selectedCustomer?.id),
  );

  const { days, totalOperacion, isVenta, isEvent } = usePriceCalculation({
    operationType,
    priceSell: item.price_sell,
    priceRent: item.price_rent,
    quantity,
    startDate: dateRange?.from,
    endDate: dateRange?.to,
    rentUnit: item?.rent_unit,
    receivedAmount: Number(downPayment),
    guaranteeAmount: guaranteeType === "dinero" ? Number(guarantee) : 0,
  });

  const toastIdRef = React.useRef<string | number | null>(null);

  // 💲 Precio unitario
  const unitPrice = isVenta ? item.price_sell || 0 : item.price_rent || 0;

  useEffect(() => {
    if (!hasStock) {
      let message = "";
      if (operationType === "venta") {
        if (stockCount === 0) {
          message = `No hay unidades disponibles para venta.`;
        } else {
          message = `Solo hay ${stockCount}  ${stockCount === 1 ? "unidad" : "unidades"} disponible${stockCount === 1 ? "" : "s"} para venta.`;
        }
      } else {
        if (stockCount === 0) {
          message = `No hay unidades disponibles para alquiler.`;
        } else {
          message = `Solo hay ${stockCount} ${stockCount === 1 ? "unidad" : "unidades"} disponible${stockCount === 1 ? "" : "s"} para alquiler.`;
        }
      }
      // Si ya hay un toast activo con este mensaje, no crear otro
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }

      toastIdRef.current = toast.error(message);
    } else {
      // Limpiar el toast cuando ya hay stock
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
        toastIdRef.current = null;
      }
    }

    // Cleanup al desmontar
    return () => {
      if (toastIdRef.current) {
        toast.dismiss(toastIdRef.current);
      }
    };
  }, [hasStock, operationType, stockCount]);

  if (!availabilityCheck.available) {
    // El mensaje detallado: "Solo tienes 3 unidades y hay 3 reservas..."
    return toast.error(availabilityCheck.reason);
  }

  const handleConfirm = () => {
    if (!selectedCustomer || !dateRange?.from) {
      return toast.error("Faltan datos obligatorios (Fecha o Cliente)");
    }

    // A. VALIDACIÓN ESPECÍFICA PARA VENTA (Apartado Físico)
    if (operationType === "venta") {
      if (assignedStockIds.length !== quantity) {
        return toast.error(
          `Debes asignar las ${quantity} prendas físicas para apartar la venta.`,
        );
      }
    }
    // B. VALIDACIÓN PARA ALQUILER (Stock Numérico)
    else {
      if (!hasStock)
        return toast.error("Stock insuficiente para las fechas seleccionadas");
    }

    // CONSTRUCCIÓN DE LOS ITEMS (Aquí está la magia)
    let transactionItems = [];

    if (operationType === "venta") {
      // VENTA: Creamos una línea por cada producto físico seleccionado
      transactionItems = assignedStockIds.map((stockId) => ({
        productId: item.id,
        productName: item.name,
        size,
        color,
        quantity: 1, // Siempre 1 porque es unitario
        priceAtMoment: unitPrice,
        stockId: stockId, // <--- ID REAL DEL WIDGET
      }));
    } else {
      // ALQUILER: Creamos una línea genérica (Cupo)
      transactionItems = [
        {
          productId: item.id,
          productName: item.name,
          size,
          color,
          quantity: quantity, // Cantidad total del cupo
          priceAtMoment: unitPrice,
          stockId: selectedStockId, // ID referencial (el primero disponible) o null si tu DB lo permite
        },
      ];
    }

    const newReservation: ReservationDTO = {
      branchId: currentBranchId,
      createdAt: new Date(),
      type: "reserva",
      operationType,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
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
      toast.success(
        operationType === "venta"
          ? "Reserva de venta creada con éxito"
          : "Reserva de alquiler creada con éxito",
      );
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
            size={size}
            color={color}
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
            maxStock={
              dateRange?.from && dateRange?.to
                ? availableInDates
                : totalPhysicalStock
            }
            setAssignedStockIds={setAssignedStockIds}
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
