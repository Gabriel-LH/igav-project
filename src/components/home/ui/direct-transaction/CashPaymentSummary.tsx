import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/src/utils/currency-format";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import {
  Wallet,
  CreditCard,
  Smartphone,
  Banknote,
  HandCoins,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface CashPaymentSummaryProps {
  type?: string;
  totalToPay: number;
  paymentMethod: PaymentMethod;
  receivedAmount: number;
  setReceivedAmount: (v: number) => void;
  changeAmount: number;
  setPaymentMethod: (v: PaymentMethod) => void;
}

export type PaymentMethod = "cash" | "card" | "transfer" | "yape" | "plin";

export function CashPaymentSummary({
  totalToPay,
  paymentMethod,
  receivedAmount,
  setReceivedAmount,
  changeAmount,
  setPaymentMethod,
}: CashPaymentSummaryProps) {

  return (
    <Card className="p-4 space-y-4 shadow-sm">
      {/* TOTAL A PAGAR HOY */}
      <div className="flex justify-between items-center bg-primary/5 p-3 rounded border-l-4 border-primary">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">
            Total a pagar hoy
          </span>
          <span className="text-[11px] text-muted-foreground">
            Según método de pago
          </span>
        </div>
        <span className="text-xl font-black text-primary">
          {formatCurrency(totalToPay)}
        </span>
      </div>

      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Monto recibido
          </Label>
          <div className="relative">
            <span className="absolute left-2.5 top-2 text-xs font-bold text-muted-foreground">
              S/.
            </span>
            <Input
              className="pl-8 h-9 font-bold"
              placeholder="0.00"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(Number(e.target.value))}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Método de pago
          </Label>
          <Select
            value={paymentMethod}
            onValueChange={(val) => setPaymentMethod(val as PaymentMethod)}
          >
            <SelectTrigger className="h-9 text-[11px] font-bold">
              <SelectValue placeholder="Seleccionar..." />
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
      </div>

      {/* VUELTO (SOLO EFECTIVO) */}
      {paymentMethod === "cash" && (
        <div className="flex justify-between items-center pt-2 border-t">
          <Label className="text-[10px] font-bold uppercase flex items-center gap-1 text-blue-500">
            <HandCoins className="w-3 h-3" /> Vuelto
          </Label>
          <span
            className={cn(
              "font-bold text-sm",
              changeAmount > 0 ? "text-emerald-500" : "text-muted-foreground",
            )}
          >
            {formatCurrency(changeAmount)}
          </span>
        </div>
      )}
    </Card>
  );
}
