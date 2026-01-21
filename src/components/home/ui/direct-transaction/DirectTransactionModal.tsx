import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PriceSummary } from "../reservation/PriceSummary"; // Reutilizamos tu componente
import { CustomerSelector } from "../reservation/CustomerSelector";
import { toast } from "sonner";
import { addDays, differenceInDays, format } from "date-fns";
import { Label } from "@/components/label";
import { ReservationCalendar } from "../reservation/ReservationCalendar";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Calendar01Icon,
  Calendar02Icon,
  Tag02Icon,
} from "@hugeicons/core-free-icons";
import { ReservationDTO } from "@/src/interfaces/reservationDTO";
import { processTransaction } from "@/src/services/transactionServices";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { STOCK_MOCK } from "@/src/mocks/mock.stock";

export function DirectTransactionModal({
  item,
  children,
  currentBranchId,
  type, // "alquiler" | "venta"
}: any) {
  // Estados simplificados para transacción directa
  const [selectedCustomer, setSelectedCustomer] = React.useState<any>(null);
  const [quantity, setQuantity] = React.useState(1);
  const [notes, setNotes] = React.useState("");

  // Fechas automáticas: Hoy -> +3 días (alquiler) o Hoy (venta)
  const [dateRange, setDateRange] = React.useState<any>({
    from: new Date(),
    to: type === "alquiler" ? addDays(new Date(), 3) : new Date(),
  });

  // Finanzas
  const [downPayment, setDownPayment] = React.useState(""); // Aquí debería ser el total
  const [guarantee, setGuarantee] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<any>("cash");
  const [guaranteeType, setGuaranteeType] = React.useState<any>("dinero");

    const sellerId = USER_MOCK[0].id;
    const stockId = STOCK_MOCK.find((prod) => prod.id === item.id)?.id || "";

    const isEvent = item.rent_unit === "evento";
    const isVenta = type === "venta";
  
    // 2. Calcular días (solo para registro de fechas, no necesariamente para precio)
    const days =
      dateRange?.from && dateRange?.to
        ? Math.max(differenceInDays(dateRange.to, dateRange.from) + 1, 1)
        : 1;
  
    // 3. Obtener el precio unitario correcto según la operación
    const unitPrice = isVenta ? item.price_sell || 0 : item.price_rent || 0;
  
    // 4. LÓGICA DE TOTAL FINAL (La que se guarda en la BD)
    const totalOperacion = useMemo(() => {
      if (isVenta) {
        return unitPrice * quantity;
      }
  
      // Si es Alquiler:
      // Si es por evento, ignoramos 'days' en la multiplicación
      return isEvent ? unitPrice * quantity : unitPrice * quantity * days;
    }, [isVenta, isEvent, unitPrice, quantity, days]);
  

  const handleConfirm = () => {
    if (!selectedCustomer) return toast.error("Seleccione un cliente");

  const transaction : ReservationDTO = {
      productId: item.id,
      productName: item.name, // Agregado para el DTO
      sku: item.sku, // Agregado para el DTO
      size: item.size || "M", // ¡IMPORTANTE! Esto debe venir del item seleccionado
      color: item.color || "N/A",
      type: type, // "alquiler" | "venta"
      status: type === "alquiler" ? "en_curso" : "vendido",
      startDate: dateRange.from,
      endDate: dateRange.to,
      quantity,
      financials: {
          total: totalOperacion, // Asegúrate de tener esta función
          downPayment: Number(downPayment),
          pendingAmount: totalOperacion - Number(downPayment),
          guarantee: isVenta
              ? { type: "no_aplica" }
              : guaranteeType === "dinero"
                  ? { type: "dinero", value: guarantee }
                  : { type: guaranteeType, description: guarantee },
          paymentMethod,
      },
      branchId: currentBranchId,
      customerId: selectedCustomer.id,
      stockId: stockId,
      customerName: selectedCustomer.name,
      sellerId: sellerId,
      notes: notes,
      createdAt: new Date(),
  };

  // 1. Validar y Repartir con Zod
  const result = processTransaction(transaction);

  // 2. ACTUALIZAR STOCK INMEDIATO
  // Como esto es directo, AQUÍ SÍ bajamos el stock físico del Store
//   updateProductStock(item.id, quantity); 

  toast.success("Operación realizada con éxito");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="uppercase text-sm font-black">
            {type === "alquiler" ? (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={Calendar02Icon} strokeWidth={2} />
                Alquiler Inmediato
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <HugeiconsIcon icon={Tag02Icon} strokeWidth={2} /> Venta Directa
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 overflow-y-auto max-h-[70vh] pr-2">
          {/* Info simplificada del producto */}
          <div className="p-3 bg-muted/50 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-bold text-sm">{item.name}</p>
              <p className="text-[10px] text-muted-foreground">
                SKU: {item.sku}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold">Stock Local</p>
              <p className="text-emerald-600 font-black">Disponible</p>
            </div>
          </div>

          {type === "alquiler" && (
            <div className="space-y-2 p-3 rounded-lg border ">
              <Label className="text-[12px] font-black uppercase text-blue-600">
                Fecha de Devolución
              </Label>
              <ReservationCalendar
                mode="single" // Cambiamos a single para que solo elija el "To"
                dateRange={{ from: dateRange.to, to: dateRange.to }}
                setDateRange={(val: any) =>
                  setDateRange({ ...dateRange, to: val?.from })
                }
                originBranchId={""}
                currentBranchId={""}
                rules={""} // ... otras props
              />
              <p className="text-[10px] text-blue-400 italic">
                * El alquiler inicia hoy {format(new Date(), "dd/MM")}
              </p>
            </div>
          )}

          <CustomerSelector
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
          />

          {/* Solo mostramos el PriceSummary porque es una transacción de dinero rápida */}
          <PriceSummary
            item={item}
            operationType={type}
            startDate={dateRange.from}
            endDate={dateRange.to}
            priceRent={item.price_rent}
            quantity={quantity}
            downPayment={downPayment}
            setDownPayment={setDownPayment}
            guarantee={guarantee}
            setGuarantee={setGuarantee}
            paymentMethod={paymentMethod}
            setPaymentMethod={setPaymentMethod}
            guaranteeType={guaranteeType}
            setGuaranteeType={setGuaranteeType}
          />
        </div>

        <Button
          onClick={handleConfirm}
          className={`w-full h-12 font-black ${type === "alquiler" ? "bg-blue-600" : "bg-orange-600"}`}
        >
          {type === "alquiler" ? "ENTREGAR Y COBRAR" : "FINALIZAR VENTA"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
