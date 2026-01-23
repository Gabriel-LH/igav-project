import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ReservationFormContent } from "./ReservationFormContent"; // El que unificamos antes
import { Button } from "@/components/ui/button";
import React, { useMemo } from "react";
import { useReservationStore } from "@/src/store/useReservationStore";
import { toast } from "sonner";
import { differenceInDays, isToday } from "date-fns";
import {
  Calendar02Icon,
  HugeiconsFreeIcons,
  ShoppingBag01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useScrollIndicator } from "@/src/utils/scroll/useScrollIndicator";
import { ReservationDTO } from "@/src/interfaces/ReservationDTO";
import { processTransaction } from "@/src/services/transactionServices";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { STOCK_MOCK } from "@/src/mocks/mock.stock";
import { useInventoryStore } from "@/src/store/useInventoryStore";

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
  const [operationType, setOperationType] = React.useState<
    "alquiler" | "venta"
  >("alquiler");
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [dateRange, setDateRange] = React.useState<any>(undefined);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  //Finanzas
  const [downPayment, setDownPayment] = React.useState("");
  const [guarantee, setGuarantee] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "card" | "transfer" | "yape" | "plin"
  >("cash");
  const [guaranteeType, setGuaranteeType] = React.useState<
    "dinero" | "dni" | "joyas" | "reloj" | "otros"
  >("dinero");

  const scrollRef = useScrollIndicator();

  const isEvent = item.rent_unit === "evento";
  const isVenta = operationType === "venta";

  const sellerId = USER_MOCK[0].id;
  // Buscamos la prenda física exacta que coincida con el modelo, talla y color
  const exactStockItem = useInventoryStore((state) =>
    state.stock.find(
      (s) =>
        String(s.productId) === String(item.id) &&
        s.size === size &&
        s.color === color &&
        s.status === "disponible",
    ),
  );

  const stockId = exactStockItem?.id; // ID fisico que se usara para la reserva
  const isAvailable = !!exactStockItem; // Booleano para el boton

  // Agrega este log para ver qué está recibiendo la función realmente
  console.log("Buscando Stock:", {
    id: item.id,
    size,
    color,
    status: "disponible",
    resultado: exactStockItem,
  });

  //Calculamos días (solo para registro de fechas, no necesariamente para precio)
  const days =
    dateRange?.from && dateRange?.to
      ? Math.max(differenceInDays(dateRange.to, dateRange.from) + 1, 1)
      : 1;

  //Obtenemos el precio unitario correcto según la operación
  const unitPrice = isVenta ? item.price_sell || 0 : item.price_rent || 0;

  //Obtenemos el total final (La que guardamos en la BD)
  const totalOperacion = useMemo(() => {
    if (isVenta) {
      return unitPrice * quantity;
    }

    // Si es Alquiler:
    // Si es por evento, ignoramos 'days' en la multiplicación
    return isEvent ? unitPrice * quantity : unitPrice * quantity * days;
  }, [isVenta, isEvent, unitPrice, quantity, days]);

  const { createReservation } = useReservationStore();

  console.log("totalOperacion", totalOperacion);

  const handleConfirm = () => {
    const isVenta = operationType === "venta";
    if (!dateRange?.from || !selectedCustomer) {
      toast.error("Faltan datos obligatorios (Fecha o Cliente)", {
        style: {
          background: "rgba(255, 0, 0, 0.15)",
        },
      });
      return;
    }

    if (!isAvailable || !stockId) {
      toast.error("Stock no disponible", {
        style: {
          background: "rgba(255, 0, 0, 0.15)",
        },
      });
      return;
    }

    // 2. Construcción del objeto según lo que pulimos
    const newRes: ReservationDTO = {
      productId: item.id,
      productName: item.name,
      createdAt: new Date(),
      sku: item.sku,
      size: size,
      color: color,
      type: operationType, // alquiler o venta
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      startDate: isVenta ? new Date() : dateRange.from,
      endDate: isVenta ? dateRange.from : dateRange.to,
      quantity: quantity,
      status: "confirmada",
      notes: notes,
      financials: {
        // priceRent: item.price_rent,
        total: totalOperacion,
        downPayment: Number(downPayment),
        paymentMethod: paymentMethod,
        pendingAmount: totalOperacion - Number(downPayment),
        guarantee: isVenta
          ? { type: "no_aplica" }
          : guaranteeType === "dinero"
            ? { type: "dinero", value: guarantee }
            : { type: guaranteeType, description: guarantee },
      },
      branchId: currentBranchId,
      stockId: stockId,
      sellerId: sellerId,
    };

    console.log("newRes", newRes);

    try {
      // 1. Procesamos y validamos con Zod
      const transactionRecord = processTransaction(newRes);

      console.log("transactionRecord", transactionRecord);

      // 2. Guardamos en el Store de Reservas/Operaciones
      createReservation(newRes);

      toast.success(
        `${operationType === "venta" ? "Venta" : "Reserva"} creada con éxito`,
      );
    } catch (error) {
      console.error("Error de validación en zod:", error);
      toast.error("Error al crear la reserva");
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
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} /> Reserva
                de Alquiler
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={ShoppingBag01Icon} strokeWidth={2} />{" "}
                Separación de Venta
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div
          ref={scrollRef}
          className="flex-1 min-h-0 overflow-y-auto py-4 pr-1 scroll-area"
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
            downPayment={downPayment}
            setDownPayment={setDownPayment}
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
          {!isAvailable || !stockId ? (
            <Button disabled className="w-full font-bold h-12 bg-red-600">
              Stock no disponible
            </Button>
          ) : (
            <Button
              className={`w-full font-bold h-12 ${isVenta ? "bg-orange-600" : "bg-emerald-600"}`}
              onClick={handleConfirm}
            >
              Confirmar reserva para {isVenta ? "Venta" : "Alquiler"}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
