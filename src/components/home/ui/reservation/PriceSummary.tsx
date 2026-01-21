import { differenceInDays } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/src/utils/currency-format";
import { BUSINESS_RULES_MOCK } from "@/src/mocks/mock.bussines_rules";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Wallet,
  PackageCheck,
  CreditCard,
  Banknote,
  Smartphone,
  HandCoins,
  IdCard,
  Gem,
  Gift,
} from "lucide-react";
import { Badge } from "@/components/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import React from "react";
import { cn } from "@/lib/utils";

interface PriceSummaryProps {
  item: any;
  startDate: Date;
  operationType: string;
  endDate: Date;
  priceRent: number;
  quantity: number;
  downPayment: string;
  setDownPayment: (val: string) => void;
  guarantee: string;
  setGuarantee: (val: string) => void;
  guaranteeType: string;
  setGuaranteeType: (val: string) => void;
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
}

export function PriceSummary({
  item,
  startDate,
  operationType,
  endDate,
  priceRent,
  quantity,
  downPayment,
  setDownPayment,
  guarantee,
  setGuarantee,
  guaranteeType,
  setGuaranteeType,
  paymentMethod,
  setPaymentMethod,
}: PriceSummaryProps) {
  // 1. DETERMINAR ESTADOS CLAVE
  const isEvent = item.rent_unit === "evento";
  const isVenta = operationType === "venta";

  // 2. CÁLCULO DE TIEMPO (Solo informativo si es evento)
  const days = Math.max(differenceInDays(endDate, startDate) + 1, 1);

  // 3. LÓGICA DE PRECIOS DINÁMICA
  const calculateTotals = () => {
    if (isVenta) {
      const subtotal = item.price_sell * quantity;
      return {
        subtotal,
        total: subtotal,
        pending: subtotal - Number(downPayment || 0),
      };
    }

    // Si es Alquiler/Reserva
    // Si es evento: precio * cantidad
    // Si es día: precio * días * cantidad
    const subtotal = isEvent
      ? priceRent * quantity
      : priceRent * days * quantity;

    const totalOperacion = subtotal; // El costo del servicio
    const pending = totalOperacion - Number(downPayment || 0);

    // Lo que el cliente paga hoy en caja: Adelanto + Garantía (si es dinero)
    const payToday =
      Number(downPayment || 0) +
      (guaranteeType === "dinero" ? Number(guarantee || 0) : 0);

    return { subtotal, total: totalOperacion, pending, payToday };
  };

  const { subtotal, total, pending, payToday } = calculateTotals();

  return (
    <Card className="shadow-md pb-2 overflow-hidden">
      <div className="bg-primary/5 px-4 py-2 border-b flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
          Resumen de Operación
        </span>
        {!isVenta && (
          <div className="flex gap-2">
            <Badge variant="outline" className="text-[9px] uppercase">
              {isEvent ? "Por Evento" : "Por Día"}
            </Badge>
            <Badge variant="secondary" className="font-mono">
              {days} {days === 1 ? "Día" : "Días"}
            </Badge>
          </div>
        )}
      </div>

      <CardContent className="px-4 space-y-4">
        {/* FILA PRECIO DETALLADO */}
        <div className="flex justify-between text-sm font-bold bg-muted/20 p-2 rounded border-l-2 border-primary">
          <div className="flex flex-col">
            <span className="text-[10px] text-muted-foreground uppercase">
              Subtotal
            </span>
            <span className="text-xs">
              {isVenta
                ? "Venta directa"
                : isEvent
                  ? "Alquiler por evento"
                  : `Alquiler x ${days} días`}
            </span>
          </div>
          <span className="text-lg self-center">
            {formatCurrency(subtotal)}
          </span>
        </div>

        {/* INPUTS DE ADELANTO Y MÉTODO */}
        <div className="flex justify-between w-full gap-4">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-blue-600 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Cobro Adelanto
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold">
                S/.
              </span>
              <Input
                className="pl-8 h-8 font-bold"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              Método
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-8 text-[10px] font-bold">
                <SelectValue placeholder="Método..." />
              </SelectTrigger>
              <SelectContent className="text-[10px]">
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
        </div>

        {/* GARANTÍA (Solo alquiler) */}
        {!isVenta && (
          <div className="space-y-2 pt-2 border-t border-dashed">
            <div className="flex justify-between items-center">
              <Label className="text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1">
                <PackageCheck className="w-3 h-3" /> Garantía ({guaranteeType})
              </Label>
              <Select
                value={guaranteeType}
                onValueChange={(v: any) => setGuaranteeType(v)}
              >
                <SelectTrigger className="h-7 w-fit text-[10px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="dinero">
                    <HandCoins className="w-3 h-3 mr-1 inline" /> Dinero
                  </SelectItem>
                  <SelectItem value="dni">
                    <IdCard className="w-3 h-3 mr-1 inline" /> DNI
                  </SelectItem>
                  <SelectItem value="joyas">
                    <Gem className="w-3 h-3 mr-1 inline" /> Joyas
                  </SelectItem>
                  <SelectItem value="otros">
                    <Gift className="w-3 h-3 mr-1 inline" /> Otros
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {guaranteeType === "dinero" ? (
              <div className="relative mt-1">
                <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold">
                  S/.
                </span>
                <Input
                  className="pl-8 h-8 text-xs border-slate-700"
                  placeholder="Monto garantía"
                  value={guarantee}
                  onChange={(e) => setGuarantee(e.target.value)}
                />
              </div>
            ) : (
              <Input
                className="h-8 text-xs"
                placeholder="Descripción del objeto..."
                value={guarantee}
                onChange={(e) => setGuarantee(e.target.value)}
              />
            )}
          </div>
        )}

        {/* BLOQUE FINAL DE TOTALES */}
        <div className="p-3 rounded-lg border shadow-sm">
          <div className="flex justify-between text-xs mb-1">
            <span>Saldo Pendiente:</span>
            <span
              className={cn(
                "font-bold",
                pending > 0 ? "text-red-400" : "text-emerald-400",
              )}
            >
              {formatCurrency(pending)}
            </span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-black/5">
            <div className="flex flex-col">
              <span className="text-[12px] font-semibold uppercase leading-none">
                Total a Pagar hoy:
              </span>
              <span className="text-[9px] text-muted-foreground italic leading-none">
                {isVenta ? "(Adelanto)" : "(Adelanto + Garantía)"}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-bold text-primary">
                {formatCurrency(
                  isVenta
                    ? Number(downPayment || 0)
                    : Number(downPayment || 0) + Number(guarantee || 0),
                )}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
