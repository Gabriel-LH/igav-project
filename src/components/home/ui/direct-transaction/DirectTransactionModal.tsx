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
  Calendar02Icon,
  Tag02Icon,
} from "@hugeicons/core-free-icons";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { Input } from "@/components/input";
import { useRentalStore } from "@/src/store/useRentalStore";
import { RentalDTO } from "@/src/interfaces/RentalDTO";
import { SaleDTO } from "@/src/interfaces/SaleDTO";

export function DirectTransactionModal({
  item,
  size,
  color,
  children,
  currentBranchId,
  type, // "alquiler" | "venta"
  onSuccess,
}: any) {
  const [open, setOpen] = React.useState(false);

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
  const [downPayment, setDownPayment] = React.useState(""); // Total del pago
  const [guarantee, setGuarantee] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<any>("cash");
  const [guaranteeType, setGuaranteeType] = React.useState<any>("dinero");
  const [receivedAmount, setReceivedAmount] = React.useState<number>(0);

// Cálculo automático del vuelto (usando useMemo para eficiencia)
const changeAmount = useMemo(() => {
  const totalACobrar = Number(downPayment) || 0; // Lo que decidiste cobrar hoy
  if (receivedAmount <= 0 || receivedAmount < totalACobrar) return 0;
  return receivedAmount - totalACobrar;
}, [receivedAmount, downPayment]);

  const createDirectRental = useRentalStore(
    (state) => state.createDirectRental,
  );

  const updateStockStatus = useInventoryStore(
    (state) => state.updateStockStatus,
  );

  const sellerId = USER_MOCK[0].id;

  // Buscamos la prenda física exacta que coincida con el modelo, talla y color
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
    if (!isAvailable || !stockId) {
      return toast.error("No hay stock disponible físicamente.");
    }

    // Base común para ambos
    const baseData = {
      productId: item.id,
      productName: item.name,
      sku: item.sku,
      size,
      color,
      quantity,
      customerId: selectedCustomer.id,
      customerName: selectedCustomer.name,
      sellerId,
      branchId: currentBranchId,
      notes,
      createdAt: new Date(),
      stockId,
    };

    if (type === "alquiler") {
      const rentalData: RentalDTO = {
        ...baseData,
        type: "alquiler",
        startDate: dateRange.from,
        endDate: dateRange.to,
        financials: {
          totalRent: totalOperacion,
          guarantee: guaranteeType === "dinero"
            ? { id: "", type: "dinero", value: guarantee }
            : { id: "", type: guaranteeType, description: guarantee },
          paymentMethod,
        },
        status: "en_curso",
        id: "",
        operationId: ""
      };
      createDirectRental(rentalData as any); // Tu store ahora recibirá datos limpios
      updateStockStatus(stockId, "alquilado");
      toast.success("Alquiler realizado correctamente");
      onSuccess();
      setOpen(false);
    } else {
      const saleData: SaleDTO = {
        ...baseData,
        type: "venta",
        totalPrice: totalOperacion,
        paymentMethod,
        status: "vendido",
        id: "",
      };
      // Aquí llamarías a un nuevo store: createSale(saleData);
      updateStockStatus(stockId, "vendido");
      toast.success("Venta realizada correctamente");
    }
    onSuccess();
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
          <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
            <div className="w-12 h-12 rounded border flex items-center justify-center font-bold text-xs uppercase text-primary">
              {size || "S/T"}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-bold uppercase">{item.name}</h4>
              <p className="text-[10px] text-muted-foreground">
                Color: {color} | SKU: {item.sku}
              </p>
            </div>
            <div className="w-20">
              <Label className="text-[9px] uppercase font-black">Cant.</Label>
              <Input
                type="number"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(Number(e.target.value))}
                className="h-8 font-bold"
              />
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
            receivedAmount={receivedAmount}
            setReceivedAmount={setReceivedAmount}
            changeAmount={changeAmount}
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

        {!isAvailable ? (
          <Button disabled className="bg-red-600">
            STOCK NO DISPONIBLE
          </Button>
        ) : (
          <Button
            onClick={handleConfirm}
            className={`w-full h-12 font-black ${type === "alquiler" ? "bg-blue-600" : "bg-orange-600"}`}
          >
            {type === "alquiler" ? "ENTREGAR Y COBRAR" : "FINALIZAR VENTA"}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
