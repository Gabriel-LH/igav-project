"use client";

import React, { useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { ShoppingBag, Calendar, BookmarkPlus } from "lucide-react";

import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { CustomerSelector } from "@/src/components/home/ui/reservation/CustomerSelector";
import { processTransaction } from "@/src/services/transactionServices";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { formatCurrency } from "@/src/utils/currency-format";
import { ReservationDTO } from "@/src/interfaces/reservationDTO";
import { DateTimeContainer } from "@/src/components/home/ui/direct-transaction/DataTimeContainer";
import { DirectTransactionCalendar } from "@/src/components/home/ui/direct-transaction/DirectTransactionCalendar";
import { TimePicker } from "@/src/components/home/ui/direct-transaction/TimePicker";
import { startOfDay, endOfDay, addDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Wallet, CreditCard, Smartphone, Banknote } from "lucide-react";
import { Client } from "@/src/types/clients/type.client";

interface PosReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PosReservationModal({
  open,
  onOpenChange,
}: PosReservationModalProps) {
  const { items, clearCart } = useCartStore();
  const { inventoryItems, stockLots } = useInventoryStore();

  const businessRules = BUSINESS_RULES_MOCK;
  const sellerId = USER_MOCK[0].id;
  const currentBranchId = USER_MOCK[0].branchId;

  // ─── ESTADOS ───
  const [selectedCustomer, setSelectedCustomer] = React.useState<Client | null>(
    null,
  );
  const [notes, setNotes] = React.useState("");

  // Fechas
  const pickupDateRef = React.useRef<HTMLButtonElement>(null);
  const pickupTimeRef = React.useRef<HTMLButtonElement>(null);
  const returnDateRef = React.useRef<HTMLButtonElement>(null);
  const returnTimeRef = React.useRef<HTMLButtonElement>(null);

  const [dateRange, setDateRange] = React.useState<{ from: Date; to: Date }>({
    from: new Date(),
    to: addDays(new Date(), 3),
  });
  const [pickupTime, setPickupTime] = React.useState(
    businessRules.openHours.open,
  );
  const [returnTime, setReturnTime] = React.useState(
    businessRules.openHours.close,
  );

  // Financieros
  const [downPayment, setDownPayment] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "card" | "transfer" | "yape" | "plin"
  >("cash");

  // ─── SEPARAR POR TIPO ───
  const ventaItems = useMemo(
    () => items.filter((i) => i.operationType === "venta"),
    [items],
  );
  const alquilerItems = useMemo(
    () => items.filter((i) => i.operationType === "alquiler"),
    [items],
  );

  const hasSales = ventaItems.length > 0;
  const hasRentals = alquilerItems.length > 0;

  // ─── CÁLCULOS ───
  const totalVentas = useMemo(
    () => ventaItems.reduce((sum, i) => sum + i.subtotal, 0),
    [ventaItems],
  );

  const totalAlquileres = useMemo(() => {
    if (!hasRentals) return 0;
    const days =
      dateRange?.from && dateRange?.to
        ? Math.max(
            Math.ceil(
              (dateRange.to.getTime() - dateRange.from.getTime()) /
                (1000 * 60 * 60 * 24),
            ) + 1,
            1,
          )
        : 1;
    return alquilerItems.reduce((sum, item) => {
      const isEvent = item.product.rent_unit === "evento";
      return sum + item.unitPrice * item.quantity * (isEvent ? 1 : days);
    }, 0);
  }, [alquilerItems, dateRange, hasRentals]);

  const totalOperacion = totalVentas + totalAlquileres;
  const pendingAmount = Math.max(totalOperacion - Number(downPayment || 0), 0);

  const operationType = hasRentals ? "alquiler" : "venta";

  // ─── CONSTRUIR ITEMS ───
  const buildReservationItems = (filterType?: "venta" | "alquiler") => {
    const transactionItems: any[] = [];
    const targetItems = filterType
      ? items.filter((i) => i.operationType === filterType)
      : items;

    for (const cartItem of targetItems) {
      const isVenta = cartItem.operationType === "venta";

      if (isVenta) {
        if (cartItem.product.is_serial) {
          if (cartItem.selectedCodes.length < cartItem.quantity) {
            toast.error(
              `"${cartItem.product.name}": Debes asignar ${cartItem.quantity} unidades serializadas.`,
            );
            return null;
          }
          cartItem.selectedCodes.forEach((id) => {
            const stockFound = inventoryItems.find(
              (s) => s.id === id || s.serialCode === id,
            );
            transactionItems.push({
              productId: cartItem.product.id,
              productName: cartItem.product.name,
              stockId: stockFound?.id || id,
              quantity: 1,
              sizeId: stockFound?.sizeId || cartItem.selectedSizeId || "---",
              colorId: stockFound?.colorId || cartItem.selectedColorId || "---",
              priceAtMoment: cartItem.unitPrice,
            });
          });
        } else {
          // No serializado: FIFO auto-assign con filtros de variante
          const candidates = stockLots.filter(
            (s) =>
              String(s.productId) === String(cartItem.product.id) &&
              s.status === "disponible" &&
              s.isForSale &&
              (!cartItem.selectedSizeId ||
                s.sizeId === cartItem.selectedSizeId) &&
              (!cartItem.selectedColorId ||
                s.colorId === cartItem.selectedColorId),
          );

          let remaining = cartItem.quantity;
          for (const lot of candidates) {
            if (remaining <= 0) break;
            const take = Math.min(remaining, lot.quantity);
            transactionItems.push({
              productId: cartItem.product.id,
              productName: cartItem.product.name,
              stockId: lot.id, // Usamos el ID (UUID)
              quantity: take,
              sizeId: lot.sizeId || cartItem.selectedSizeId || "---",
              colorId: lot.colorId || cartItem.selectedColorId || "---",
              priceAtMoment: cartItem.unitPrice,
            });
            remaining -= take;
          }
          if (remaining > 0) {
            toast.error(
              `"${cartItem.product.name}": Stock insuficiente (${cartItem.selectedSizeId || ""} ${cartItem.selectedColorId || ""}) para la venta.`,
            );
            return null;
          }
        }
      } else {
        // Alquileres
        for (let i = 0; i < cartItem.quantity; i++) {
          transactionItems.push({
            productId: cartItem.product.id,
            productName: cartItem.product.name,
            stockId: undefined, // Virtual
            quantity: 1,
            sizeId: cartItem.selectedSizeId || "---",
            colorId: cartItem.selectedColorId || "---",
            priceAtMoment: cartItem.unitPrice,
          });
        }
      }
    }

    return transactionItems;
  };

  // ─── CONFIRMAR ───
  const handleConfirm = () => {
    if (!selectedCustomer) return toast.error("Seleccione un cliente");
    if (items.length === 0) return toast.error("El carrito está vacío");
    if (!dateRange?.from) return toast.error("Seleccione una fecha");
    if (Number(downPayment) <= 0) {
      return toast.error("Ingrese un adelanto mayor a 0");
    }

    const totalDP = Number(downPayment);

    if (hasSales && hasRentals) {
      const saleShare = totalVentas / totalOperacion;
      const saleDP = Math.round(totalDP * saleShare * 100) / 100;
      const rentalDP = Math.round((totalDP - saleDP) * 100) / 100;

      const saleItems = buildReservationItems("venta");
      if (!saleItems) return;
      const saleDTO: ReservationDTO = {
        branchId: currentBranchId,
        createdAt: new Date(),
        type: "reserva",
        operationType: "venta",
        customerId: selectedCustomer.id,
        customerName:
          selectedCustomer.firstName + " " + selectedCustomer.lastName,
        status: "confirmada",
        notes: notes + " (Venta de operacion mixta)",
        financials: {
          receivedAmount: saleDP,
          keepAsCredit: false,
          totalPrice: totalVentas,
          downPayment: saleDP,
          paymentMethod,
          pendingAmount: Math.max(totalVentas - saleDP, 0),
        },
        sellerId,
        reservationDateRange: {
          from: startOfDay(dateRange.from),
          to: endOfDay(dateRange.to || dateRange.from),
          hourFrom: pickupTime,
        },
        id: "",
        operationId: "",
        items: saleItems,
        updatedAt: new Date(),
      };

      const rentalItems = buildReservationItems("alquiler");
      if (!rentalItems) return;
      const rentalDTO: ReservationDTO = {
        branchId: currentBranchId,
        createdAt: new Date(),
        type: "reserva",
        operationType: "alquiler",
        customerId: selectedCustomer.id,
        customerName:
          selectedCustomer.firstName + " " + selectedCustomer.lastName,
        status: "confirmada",
        notes: notes + " (Alquiler de operacion mixta)",
        financials: {
          receivedAmount: rentalDP,
          keepAsCredit: false,
          totalPrice: totalAlquileres,
          downPayment: rentalDP,
          paymentMethod,
          pendingAmount: Math.max(totalAlquileres - rentalDP, 0),
        },
        sellerId,
        reservationDateRange: {
          from: startOfDay(dateRange.from),
          to: endOfDay(dateRange.to || dateRange.from),
          hourFrom: pickupTime,
        },
        id: "",
        operationId: "",
        items: rentalItems,
        updatedAt: new Date(),
      };

      try {
        processTransaction(saleDTO);
        processTransaction(rentalDTO);
        toast.success(`Dos reservas creadas (Venta + Alquiler)`);
      } catch (err) {
        console.error(err);
        toast.error("Error al procesar la reserva mixta");
        return;
      }
    } else {
      const transactionItems = buildReservationItems();
      if (!transactionItems) return;

      const newReservation: ReservationDTO = {
        branchId: currentBranchId,
        createdAt: new Date(),
        type: "reserva",
        operationType,
        customerId: selectedCustomer.id,
        customerName:
          selectedCustomer.firstName + " " + selectedCustomer.lastName,
        status: "confirmada",
        notes,
        financials: {
          receivedAmount: totalDP,
          keepAsCredit: false,
          totalPrice: totalOperacion,
          downPayment: totalDP,
          paymentMethod,
          pendingAmount,
        },
        sellerId,
        reservationDateRange: {
          from: startOfDay(dateRange.from),
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
          `Reserva de ${operationType} creada. Adelanto: ${formatCurrency(totalDP)}`,
        );
      } catch (err) {
        console.error(err);
        toast.error("Error al procesar la reserva");
        return;
      }
    }

    clearCart();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-dvh sm:max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="uppercase text-sm font-black flex items-center gap-2 text-amber-700">
            <BookmarkPlus className="w-5 h-5" />
            Reservar — Con Adelanto
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Separa los productos con un adelanto. El saldo se paga al recoger.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 min-h-0 overflow-y-auto space-y-4 py-2 pr-1">
          {/* ─── RESUMEN ─── */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black text-muted-foreground">
              Productos a reservar ({items.length})
            </Label>

            {hasSales && (
              <div className="border rounded-lg p-3 ">
                <div className="flex items-center gap-2 mb-2">
                  <ShoppingBag className="w-4 h-4 text-orange-500" />
                  <span className="text-xs font-black uppercase text-orange-500">
                    Ventas
                  </span>
                </div>
                {ventaItems.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex justify-between text-xs py-1 border-t border-orange-100/50"
                  >
                    <span>
                      {item.product.name}{" "}
                      <span className="text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="font-bold">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {hasRentals && (
              <div className="border rounded-lg p-3 ">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar className="w-4 h-4 text-blue-500" />
                  <span className="text-xs font-black uppercase text-blue-500">
                    Alquileres
                  </span>
                </div>
                {alquilerItems.map((item) => (
                  <div
                    key={item.cartId}
                    className="flex justify-between text-xs py-1 border-t border-blue-100/50"
                  >
                    <span>
                      {item.product.name}{" "}
                      <span className="text-muted-foreground">
                        ×{item.quantity}
                      </span>
                    </span>
                    <span className="font-bold">
                      {formatCurrency(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ─── FECHAS ─── */}
          <div className="space-y-2">
            <Label className="text-[10px] uppercase font-black text-muted-foreground">
              Período de Reserva
            </Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <DateTimeContainer
                  label="Fecha Recojo"
                  date={dateRange.from}
                  time={pickupTime}
                  onDateClick={() => pickupDateRef.current?.click()}
                  onTimeClick={() => pickupTimeRef.current?.click()}
                  placeholderDate="Seleccionar"
                  placeholderTime="Hora"
                />
                <div className="absolute opacity-0 pointer-events-none top-0">
                  <DirectTransactionCalendar
                    triggerRef={pickupDateRef}
                    selectedDate={dateRange.from}
                    onSelect={(date: Date | undefined) => {
                      if (date) setDateRange({ ...dateRange, from: date });
                    }}
                    mode="pickup"
                    productId=""
                    sizeId=""
                    colorId=""
                    quantity={1}
                    type="alquiler"
                  />
                  <TimePicker
                    triggerRef={pickupTimeRef}
                    value={pickupTime}
                    onChange={setPickupTime}
                  />
                </div>
              </div>

              {hasRentals && (
                <div className="relative">
                  <DateTimeContainer
                    label="Fecha Devolución"
                    date={dateRange.to}
                    time={returnTime}
                    onDateClick={() => returnDateRef.current?.click()}
                    onTimeClick={() => returnTimeRef.current?.click()}
                    placeholderDate="Seleccionar"
                    placeholderTime="Hora"
                  />
                  <div className="absolute opacity-0 pointer-events-none top-0">
                    <DirectTransactionCalendar
                      triggerRef={returnDateRef}
                      minDate={dateRange.from}
                      selectedDate={dateRange.to}
                      onSelect={(date: Date | undefined) => {
                        if (date) setDateRange({ ...dateRange, to: date });
                      }}
                      mode="return"
                      type="alquiler"
                      productId=""
                      sizeId=""
                      colorId=""
                      quantity={1}
                    />
                    <TimePicker
                      triggerRef={returnTimeRef}
                      value={returnTime}
                      onChange={setReturnTime}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ─── CLIENTE ─── */}
          <CustomerSelector
            selected={selectedCustomer}
            onSelect={setSelectedCustomer}
          />

          {/* ─── TOTAL Y ADELANTO ─── */}
          <div className="space-y-3">
            <div className="bg-primary/5 p-3 rounded-lg border-l-2 border-primary">
              <div className="flex justify-between items-center">
                <span className="text-sm font-bold uppercase">
                  Total de la operación
                </span>
                <span className="text-xl font-black text-primary">
                  {formatCurrency(totalOperacion)}
                </span>
              </div>
            </div>

            {/* Adelanto */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-[10px] font-bold uppercase flex items-center gap-1">
                  <Banknote className="w-3 h-3" /> Adelanto
                </Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(val) =>
                    setPaymentMethod(val as typeof paymentMethod)
                  }
                >
                  <SelectTrigger className="h-7 w-32 text-[10px] font-bold">
                    <SelectValue placeholder="Método" />
                  </SelectTrigger>
                  <SelectContent className="text-[11px]">
                    <SelectItem value="cash">
                      <Wallet className="w-3 h-3 mr-1 inline" /> Efectivo
                    </SelectItem>
                    <SelectItem value="card">
                      <CreditCard className="w-3 h-3 mr-1 inline" /> Tarjeta
                    </SelectItem>
                    <SelectItem value="yape">
                      <Smartphone className="w-3 h-3 mr-1 inline" /> Yape
                    </SelectItem>
                    <SelectItem value="plin">
                      <Smartphone className="w-3 h-3 mr-1 inline" /> Plin
                    </SelectItem>
                    <SelectItem value="transfer">
                      <Banknote className="w-3 h-3 mr-1 inline" /> Transferencia
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <span className="absolute left-2.5 top-2.5 text-xs font-bold">
                  S/.
                </span>
                <Input
                  className="pl-7 h-9 font-semibold"
                  placeholder="0.00"
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                />
              </div>
            </div>

            {/* Pendiente */}
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-muted-foreground">
                Saldo pendiente
              </span>
              <span className="text-lg font-black text-amber-700">
                {formatCurrency(pendingAmount)}
              </span>
            </div>
          </div>

          {/* Notas */}
          <div>
            <Label className="text-[10px] uppercase font-bold mb-1">
              Notas
            </Label>
            <Input
              placeholder="Observaciones adicionales..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="h-8 text-xs"
            />
          </div>
        </div>

        {/* ─── BOTÓN CONFIRMAR ─── */}
        <div className="pt-4 border-t">
          <Button
            onClick={handleConfirm}
            disabled={
              items.length === 0 ||
              !selectedCustomer ||
              Number(downPayment) <= 0
            }
            className="w-full h-12 font-black text-white bg-linear-to-r from-amber-500 via-amber-600 to-amber-700 hover:from-amber-600 hover:to-amber-800 shadow-lg"
          >
            <BookmarkPlus className="w-5 h-5 mr-2" />
            RESERVAR — Adelanto {formatCurrency(Number(downPayment || 0))}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
