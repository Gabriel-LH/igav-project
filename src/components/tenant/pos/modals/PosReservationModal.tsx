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
import { ShoppingBag, Calendar, BookmarkPlus, Info } from "lucide-react";

import { useCartStore } from "@/src/store/useCartStore";
import { useInventoryStore } from "@/src/store/useInventoryStore";
import { processTransactionAction, reserveBundlesAction } from "@/src/app/(tenant)/tenant/actions/transaction.actions";
import { useSessionStore } from "@/src/store/useSessionStore";
import { useBranchStore } from "@/src/store/useBranchStore";
import { CustomerSelector } from "@/src/components/tenant/home/ui/reservation/CustomerSelector";
import { formatCurrency } from "@/src/utils/currency-format";
import { ReservationDTO } from "@/src/application/dtos/ReservationDTO";
import { DirectTransactionCalendar } from "@/src/components/tenant/home/ui/direct-transaction/DirectTransactionCalendar";
import { TimePicker } from "@/src/components/tenant/home/ui/direct-transaction/TimePicker";
import { addDays } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Banknote, CreditCard, Smartphone } from "lucide-react";
import { Client } from "@/src/types/clients/type.client";
import { getAvailabilityByAttributes } from "@/src/utils/reservation/checkAvailability";
import { useTenantConfigStore } from "@/src/store/useTenantConfigStore";

interface PosReservationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PosReservationModal({
  open,
  onOpenChange,
}: PosReservationModalProps) {
  const { items, clearCart, activeTenantId } = useCartStore();
  const { productVariants } = useInventoryStore();
  const { policy } = useTenantConfigStore();

  const user = useSessionStore((state) => state.user);
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);

  const sellerId = user?.id || "";
  const currentBranchId = selectedBranchId || "";

  // ─── ESTADOS ───
  const [selectedCustomer, setSelectedCustomer] = React.useState<Client | null>(
    null,
  );
  const [notes, setNotes] = React.useState("");

  // Fechas
  const [pickupDate, setPickupDate] = React.useState<Date | undefined>(new Date());
  const [returnDate, setReturnDate] = React.useState<Date | undefined>(addDays(new Date(), 3));
  
  const [pickupTime, setPickupTime] = React.useState("08:00");
  const [returnTime, setReturnTime] = React.useState("18:00");

  // Financieros
  const [downPayment, setDownPayment] = React.useState("");
  const [paymentMethod, setPaymentMethod] = React.useState<
    "cash" | "card" | "transfer" | "yape" | "plin"
  >("cash");

  // ─── CALCULOS GLOBALES ───
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

  const totalVentas = useMemo(
    () => ventaItems.reduce((acc, i) => acc + i.subtotal, 0),
    [ventaItems],
  );
  const totalAlquileres = useMemo(
    () => alquilerItems.reduce((acc, i) => acc + i.subtotal, 0),
    [alquilerItems],
  );
  const totalOperacion = useMemo(
    () => items.reduce((acc, i) => acc + i.subtotal, 0),
    [items],
  );

  // ─── CALCULOS DE POLITICA ───
  const minRequiredDP = useMemo(() => {
    if (!policy?.reservations.requireDownPayment) return 0;
    const percentage = policy.reservations.minDownPaymentPercentage || 0;
    return (totalOperacion * percentage) / 100;
  }, [policy, totalOperacion]);

  const isDPValid = useMemo(() => {
    if (!policy?.reservations.requireDownPayment) return true;
    const amount = parseFloat(downPayment) || 0;
    return amount >= minRequiredDP;
  }, [downPayment, minRequiredDP, policy]);

  // ─── VALIDACIONES ───
  const buildReservationItems = (type: "venta" | "alquiler") => {
    const list = type === "venta" ? ventaItems : alquilerItems;
    if (list.length === 0) return null;

    return list.map((item) => {
      const variant = productVariants.find((v) => v.id === item.variantId);

      // Disponibilidad para alquiler
      if (type === "alquiler" && pickupDate && returnDate) {
        const check = getAvailabilityByAttributes(
          item.product.id,
          item.variantId || "",
          pickupDate,
          returnDate,
          "alquiler",
        );
        if (check.availableCount < item.quantity) {
          toast.error(
            `No hay disponibilidad para ${item.product.name} (${variant?.variantSignature || "N/A"}). Requerido: ${item.quantity}, Disponible: ${check.availableCount}`,
          );
          throw new Error("Disponibilidad insuficiente");
        }
      }

      return {
        productId: item.product.id,
        productName: item.product.name,
        stockId: item.variantId || "", // Usamos variantId como fallback de stockId en la fase de reserva
        quantity: item.quantity,
        variantId: item.variantId || "",
        priceAtMoment: item.unitPrice,
        listPrice: item.listPrice,
        discountAmount: item.discountAmount,
        discountReason: item.discountReason,
        promotionId: item.appliedPromotionId,
        bundleId: item.bundleId,
      };
    });
  };

  const handleCreateReservation = async () => {
    if (!selectedCustomer) {
      toast.error("Seleccione un cliente");
      return;
    }

    if (hasRentals && (!pickupDate || !returnDate)) {
      toast.error("Seleccione las fechas de alquiler");
      return;
    }

    const totalDP = parseFloat(downPayment) || 0;

    // Validación de política de adelanto
    if (policy?.reservations.requireDownPayment && totalDP < minRequiredDP) {
      toast.error(
        `El adelanto mínimo es ${formatCurrency(minRequiredDP)} (${policy.reservations.minDownPaymentPercentage}%)`,
      );
      return;
    }

    // ─── BUNDLES LOCKER ───
    if (items.some((item) => item.bundleId)) {
      const tenantId = activeTenantId ?? items[0]?.product.tenantId;
      if (!tenantId) throw new Error("Tenant no resuelto para bundle");

      const res = await reserveBundlesAction(
        items,
        tenantId,
        currentBranchId,
        pickupDate || new Date(),
        returnDate || addDays(new Date(), 3),
      );

      if (!res.success) throw new Error(res.error);
    }

    const tenantId = activeTenantId ?? items[0]?.product.tenantId;
    if (!tenantId) throw new Error("Tenant no resuelto");

    if (hasSales && hasRentals) {
      const saleShare = totalVentas / totalOperacion;
      const saleDP = Math.round(totalDP * saleShare * 100) / 100;
      const rentalDP = Math.round((totalDP - saleDP) * 100) / 100;

      const saleItems = buildReservationItems("venta");
      if (!saleItems) return;
      const saleDTO: any = {
        id: crypto.randomUUID(),
        operationId: crypto.randomUUID(),
        tenantId,
        branchId: currentBranchId,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "reserva",
        operationType: "venta",
        customerId: selectedCustomer.id,
        status: "confirmada",
        notes: notes + " (Parte de operacion mixta)",
        items: saleItems,
        reservationDateRange: {
          from: new Date(),
          to: new Date(),
          hourFrom: "00:00",
        },
        financials: {
          subtotal: totalVentas,
          totalDiscount: 0,
          totalAmount: totalVentas,
          receivedAmount: saleDP,
          paymentMethod,
        },
        sellerId,
      };

      const rentalItems = buildReservationItems("alquiler");
      if (!rentalItems) return;
      const rentalDTO: any = {
        id: crypto.randomUUID(),
        operationId: crypto.randomUUID(),
        tenantId,
        branchId: currentBranchId,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "reserva",
        operationType: "alquiler",
        customerId: selectedCustomer.id,
        status: "confirmada",
        notes: notes + " (Parte de operacion mixta)",
        items: rentalItems,
        reservationDateRange: {
          from: pickupDate,
          to: returnDate,
          hourFrom: pickupTime,
        },
        financials: {
          subtotal: totalAlquileres,
          totalDiscount: 0,
          totalAmount: totalAlquileres,
          receivedAmount: rentalDP,
          paymentMethod,
        },
        sellerId,
      };

      try {
        const resSell = await processTransactionAction(saleDTO);
        if (!resSell.success) throw new Error(resSell.error);
        const resRent = await processTransactionAction(rentalDTO);
        if (!resRent.success) throw new Error(resRent.error);
        toast.success(`Dos reservas creadas (Venta + Alquiler)`);
      } catch (err: any) {
        toast.error("Error: " + err.message);
      }
    } else {
      const opType = hasSales ? "venta" : "alquiler";
      const resItems = buildReservationItems(opType);
      if (!resItems) return;

      const newReservation: any = {
        id: crypto.randomUUID(),
        operationId: crypto.randomUUID(),
        tenantId,
        branchId: currentBranchId,
        createdAt: new Date(),
        updatedAt: new Date(),
        type: "reserva",
        operationType: opType,
        customerId: selectedCustomer.id,
        status: "confirmada",
        notes,
        items: resItems,
        reservationDateRange: {
          from: opType === "alquiler" ? pickupDate : new Date(),
          to: opType === "alquiler" ? returnDate : new Date(),
          hourFrom: opType === "alquiler" ? pickupTime : "00:00",
        },
        financials: {
          subtotal: totalOperacion,
          totalDiscount: 0,
          totalAmount: totalOperacion,
          receivedAmount: totalDP,
          paymentMethod,
        },
        sellerId,
      };

      try {
        const result = await processTransactionAction(newReservation);
        if (!result.success) throw new Error(result.error);
        toast.success(
          `Reserva de ${opType} creada. Adelanto: ${formatCurrency(totalDP)}`,
        );
      } catch (err: any) {
        toast.error("Error: " + err.message);
      }
    }

    clearCart();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookmarkPlus className="w-5 h-5 text-primary" /> Reserva Profesional
          </DialogTitle>
          <DialogDescription>
            Configure fechas y adelanto para la reserva del cliente.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Cliente</Label>
              <CustomerSelector
                selected={selectedCustomer}
                onSelect={(c: any) => setSelectedCustomer(c)}
              />
            </div>

            {hasRentals && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/30">
                <h4 className="flex items-center gap-2 text-sm font-semibold">
                  <Calendar className="w-4 h-4" /> Fechas de Alquiler
                </h4>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Fecha Recojo</Label>
                    <DirectTransactionCalendar
                      selectedDate={pickupDate}
                      onSelect={(d) => setPickupDate(d)}
                      mode="pickup"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Hora Recojo</Label>
                    <TimePicker value={pickupTime} onChange={setPickupTime} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Fecha Devolución</Label>
                    <DirectTransactionCalendar
                      selectedDate={returnDate}
                      onSelect={setReturnDate}
                      mode="return"
                      minDate={pickupDate}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Hora Devolución</Label>
                    <TimePicker value={returnTime} onChange={setReturnTime} />
                  </div>
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label>Notas</Label>
              <Input
                placeholder="Ej: Pendiente confirmar talla..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="border rounded-lg p-4 bg-primary/5">
              <h4 className="flex items-center gap-2 text-sm font-semibold mb-3">
                <ShoppingBag className="w-4 h-4" /> Resumen
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total Operación:</span>
                  <span>{formatCurrency(totalOperacion)}</span>
                </div>
                <Separator className="my-2" />
                <div className="space-y-1 text-xs text-muted-foreground">
                  {hasSales && <p>Ventas: {formatCurrency(totalVentas)}</p>}
                  {hasRentals && (
                    <p>Alquileres: {formatCurrency(totalAlquileres)}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-4 border rounded-lg p-4">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-semibold">Adelanto</h4>
                {policy?.reservations.requireDownPayment && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full ${isDPValid ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700 font-medium"}`}
                  >
                    Mínimo: {formatCurrency(minRequiredDP)} (
                    {policy.reservations.minDownPaymentPercentage}%)
                  </span>
                )}
              </div>
              <Input
                type="number"
                placeholder="0.00"
                className={
                  !isDPValid && policy?.reservations.requireDownPayment
                    ? "border-orange-500 focus-visible:ring-orange-500"
                    : ""
                }
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />

              <Label className="text-xs">Método</Label>
              <Select
                value={paymentMethod}
                onValueChange={(v: any) => setPaymentMethod(v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Efectivo</SelectItem>
                  <SelectItem value="card">Tarjeta</SelectItem>
                  <SelectItem value="transfer">Transferencia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              className="w-full h-12"
              disabled={
                !selectedCustomer ||
                (policy?.reservations.requireDownPayment && !isDPValid)
              }
              onClick={handleCreateReservation}
            >
              Procesar Reserva
            </Button>
          </div>
        </div>

      </DialogContent>
    </Dialog>
  );
}
