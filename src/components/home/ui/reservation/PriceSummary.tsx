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

interface PriceSummaryProps {
  startDate: Date;
  endDate: Date;
  priceRent: number;
  quantity: number;
  downPayment: string;
  setDownPayment: (val: string) => void;
  guarantee: string;
  setGuarantee: (val: string) => void;
  // Nuevas props para pulir el diseño
  paymentMethod: string;
  setPaymentMethod: (val: string) => void;
}

export function PriceSummary({
  startDate,
  endDate,
  priceRent,
  quantity,
  downPayment,
  setDownPayment,
  guarantee,
  setGuarantee,
  paymentMethod,
  setPaymentMethod,
}: PriceSummaryProps) {
  const days = Math.max(differenceInDays(endDate, startDate) + 1, 1);
  const subtotalRental = priceRent * days * quantity;
  const pendingAmount = subtotalRental - Number(downPayment);
  const [guaranteeType, setGuaranteeType] = React.useState<
    "dinero" | "dni" | "joyas" | "reloj" | "otros"
  >("dinero");
  const [guaranteeOtherType, setGuaranteeOtherType] = React.useState("");

  Number(downPayment) + (guaranteeType === "dinero" ? Number(guarantee) : 0);

  return (
    <Card className="shadow-md pb-2 overflow-hidden">
      <div className="bg-primary/5 px-4 py-2 border-b flex justify-between items-center">
        <span className="text-[10px] font-black uppercase tracking-wider text-primary">
          Resumen de Operación
        </span>
        <Badge variant="secondary" className="font-mono">
          {days} {days === 1 ? "Día" : "Días"}
        </Badge>
      </div>

      <CardContent className="px-4 space-y-3">
        {/* FILA 1: ADELANTO Y MÉTODO */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-[10px]  font-bold uppercase text-blue-600 flex items-center gap-1">
              <Banknote className="w-3 h-3" /> Adelanto
            </Label>
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold">
                S/.
              </span>
              <Input
                className="pl-8 h-8 font-bold focus-visible:ring-blue-500"
                value={downPayment}
                onChange={(e) => setDownPayment(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              Método de Pago
            </Label>

            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="h-8 text-[10px] font-bold">
                <SelectValue placeholder="Selecciona método..." />
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

        {/* FILA 2: GARANTÍA CONFIGURABLE */}
        <div className="space-y-2 pt-2 border-t border-dashed">
          <div className="flex justify-between items-center">
            <Label className="text-[10px] font-bold uppercase text-amber-600 flex items-center gap-1">
              <PackageCheck className="w-3 h-3" /> Garantía
            </Label>

            {/* NUEVO SELECT CON TIPOS */}
            <Select
              value={guaranteeType}
              onValueChange={(value) =>
                setGuaranteeType(
                  value as "dinero" | "dni" | "joyas" | "reloj" | "otros",
                )
              }
            >
              <SelectTrigger className="h-7 text-[10px]">
                <SelectValue placeholder="Tipo..." />
              </SelectTrigger>
              <SelectContent className="text-[10px]">
                <SelectItem value="dinero">Dinero</SelectItem>
                <SelectItem value="dni">DNI</SelectItem>
                <SelectItem value="joyas">Joyas</SelectItem>
                <SelectItem value="reloj">Reloj</SelectItem>
                <SelectItem value="otros">Otros</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* DINERO */}
          {guaranteeType === "dinero" && (
            <div className="relative animate-in slide-in-from-top-1 mt-2">
              <span className="absolute left-2.5 top-2 text-xs text-muted-foreground font-bold">
                S/.
              </span>
              <Input
                className="pl-8 h-8 font-bold border-amber-200 focus-visible:ring-input"
                placeholder="0.00"
                value={guarantee} // monto
                onChange={(e) => setGuarantee(e.target.value)}
              />
            </div>
          )}

          {/* OBJETOS: DNI, Joyas, Reloj */}
          {(guaranteeType === "dni" ||
            guaranteeType === "joyas" ||
            guaranteeType === "reloj") && (
            <div className="animate-in slide-in-from-top-1 mt-2">
              <Input
                className="h-8 text-xs"
                placeholder={`Descripción de ${guaranteeType}`}
                value={guarantee}
                onChange={(e) => setGuarantee(e.target.value)}
              />
            </div>
          )}

          {/* OTROS: Tipo + descripción */}
          {guaranteeType === "otros" && (
            <div className="mt-2 flex gap-2 animate-in slide-in-from-top-1">
              <Input
                className="w-24 h-8 text-xs"
                placeholder="Tipo"
                value={guaranteeOtherType}
                onChange={(e) => setGuaranteeOtherType(e.target.value)}
              />
              <Input
                className="flex-1 h-8 text-xs"
                placeholder="Descripción"
                value={guarantee}
                onChange={(e) => setGuarantee(e.target.value)}
              />
            </div>
          )}
        </div>
        {/* TOTALES */}
        <div className="bg-muted/30 p-3 rounded-lg space-y-2 border">
          <div className="flex justify-between text-[11px]">
            <span className="text-muted-foreground italic">
              Restante por cobrar:
            </span>
            <span className="font-bold text-red-500">
              {formatCurrency(pendingAmount)}
            </span>
          </div>
          <div className="flex justify-between items-baseline pt-1 border-t">
            <span className="text-xs font-semibold">TOTAL HOY:</span>
            <div className="text-right">
              <div className="text-xl font-semibold text-primary">
                {formatCurrency(
                  Number(downPayment) +
                    (guaranteeType === "dinero" ? Number(guarantee) : 0),
                )}
              </div>
              <p className="text-[9px] text-muted-foreground leading-none">
                (Adelanto + Garantía)
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
