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
  const [paymentMethod, setPaymentMethod] =
    React.useState<PaymentMethodType>("cash");

  const [keepAsCredit, setKeepAsCredit] = React.useState(false);
  const [amountPaid, setAmountPaid] = React.useState("");

  const [useCredit, setUseCredit] = React.useState(false);

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

  // 2. STOCK FÍSICO TOTAL (Para el max)
  // Usamos el helper centralizado para garantizar consistencia con las validaciones
  const totalPhysicalStock = useMemo(() => {
    return getTotalStock(item.id, size, color, operationType);
  }, [item.id, size, color, operationType]); // allStock es dependencia implícita del store en el helper, pero react query/zustand manejan eso.
  // Nota: getTotalStock usa getState(), así que no es reactivo por sí mismo si allStock cambia.
  // Pero aquí estamos forzando re-render via useInventoryStore hook arriba que actualiza el componente.
  // Para ser puristas, deberíamos pasarle el stock al helper o confiar en que el render actualiza.
  // Dado que getTotalStock lee getState(), leerá lo último.

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

  const stockCount = validStockCandidates.reduce(
    (acc, s) => acc + s.quantity,
    0,
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

  // 💲 Precio unitario
  const unitPrice = isVenta ? item.price_sell || 0 : item.price_rent || 0;

  // En ReservationModal.tsx, cuando se abre el modal
  React.useEffect(() => {
    if (open) {
      // Determinar qué operaciones están disponibles
      const hasRentStock = validStockCandidates.some((s) => s.isForRent);
      const hasSaleStock = validStockCandidates.some((s) => s.isForSale);

      // Si solo hay un tipo disponible, seleccionarlo automáticamente
      if (hasRentStock && !hasSaleStock) {
        setOperationType("alquiler");
      } else if (!hasRentStock && hasSaleStock) {
        setOperationType("venta");
      }
      // Si hay ambos, mantener el que estaba
    }
  }, [open, validStockCandidates]);

  const realPaidAmount = Number(amountPaid) || Number(downPayment);
  const overpayment =
    realPaidAmount > totalOperacion ? realPaidAmount - totalOperacion : 0;

  const handleConfirm = () => {
    // 1. VALIDACIONES BÁSICAS
    if (!selectedCustomer || !dateRange?.from) {
      return toast.error("Faltan datos obligatorios (Fecha o Cliente)");
    }

    // 2. VALIDACIÓN DE DISPONIBILIDAD GLOBAL
    if (operationType === "alquiler") {
      // Para alquiler: Validamos "Cupos" en fechas (virtual)
      if (quantity > availableInDates) {
        return toast.error(
          `Solo hay ${availableInDates} unidades disponibles para esas fechas.`,
        );
      }
    } else {
      // Para venta: Validamos existencia física actual
      if (!hasStock) {
        return toast.error(`Stock insuficiente para realizar la venta.`);
      }
    }

    // 3. CONSTRUCCIÓN DE ITEMS (LA LÓGICA CORE)
    let transactionItems: any[] = [];

    // =====================================================================
    // RAMA A: VENTA (Requiere Asignación Física Inmediata)
    // =====================================================================
    if (operationType === "venta") {
      if (item.is_serial) {
        // CASO SERIALIZADO: El usuario DEBE haber seleccionado los IDs en el widget
        if (assignedStockIds.length !== quantity) {
          return toast.error(
            `Venta: Debes asignar las ${quantity} prendas físicas exactas para retirar.`,
          );
        }
        // Mapeamos los IDs que el usuario seleccionó
        transactionItems = assignedStockIds.map((stockId) => ({
          productId: item.id,
          productName: item.name,
          size,
          color,
          quantity: 1,
          priceAtMoment: unitPrice,
          stockId: stockId, // 👈 VENTA: LLEVA ID
        }));
      } else {
        // CASO NO SERIALIZADO (Lotes): Tomamos automáticamente del stock disponible (FIFO)
        let remainingQty = quantity;
        for (const stockItem of validStockCandidates) {
          if (remainingQty <= 0) break;
          const take = Math.min(remainingQty, stockItem.quantity);

          transactionItems.push({
            productId: item.id,
            productName: item.name,
            size,
            color,
            quantity: take,
            priceAtMoment: unitPrice,
            stockId: stockItem.id, // 👈 VENTA: LLEVA ID DEL LOTE
          });
          remainingQty -= take;
        }
      }
    }

    // =====================================================================
    // RAMA B: ALQUILER (Reserva Virtual - Sin ID Físico)
    // =====================================================================
    else {
      // En alquiler, NO asignamos stockId ahora. Se asignará al momento del retiro (pickup).
      // Creamos "1 item virtual" por cada unidad solicitada.
      for (let i = 0; i < quantity; i++) {
        transactionItems.push({
          productId: item.id,
          productName: item.name,
          size,
          color,
          quantity: 1, // Desglosamos unitariamente para facilitar gestión futura
          priceAtMoment: unitPrice,
          stockId: undefined, // 👈 ALQUILER: VIRTUAL (Sin ID todavía)
        });
      }
    }

    // 4. CREAR DTO
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
        receivedAmount: realPaidAmount,
        keepAsCredit,
        totalPrice: totalOperacion,
        downPayment: Number(downPayment),
        paymentMethod,
        pendingAmount: Math.max(totalOperacion - Number(downPayment), 0),
      },
      sellerId,
      reservationDateRange: {
        from: startOfDay(dateRange.from) || new Date(),
        to: endOfDay(dateRange.to || dateRange.from),
        hourFrom: pickupTime,
      },
      id: "",
      operationId: "",

      items: transactionItems, // <--- Aquí va el array generado arriba

      updatedAt: new Date(),
    };

    // 5. PROCESAR
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
