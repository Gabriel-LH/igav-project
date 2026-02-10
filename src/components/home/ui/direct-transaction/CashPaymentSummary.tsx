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
import { GuaranteeSection } from "../reservation/GuaranteeSection";
import { PaymentMethodType } from "@/src/utils/status-type/PaymentMethodType";
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";

interface CashPaymentSummaryProps {
  checklist: {
    deliverAfter: boolean;
    guaranteeAfter: boolean;
  };
  type?: string;
  totalToPay: number;
  paymentMethod: PaymentMethodType;
  receivedAmount: string;
  setReceivedAmount: (v: string) => void;
  changeAmount: number;
  setPaymentMethod: (v: PaymentMethodType) => void;
  guarantee: string;
  setGuarantee: (v: string) => void;
  guaranteeType: GuaranteeType;
  setGuaranteeType: (v: GuaranteeType) => void;
}

export function CashPaymentSummary({
  checklist,
  type,
  totalToPay,
  paymentMethod,
  receivedAmount,
  setReceivedAmount,
  changeAmount,
  setPaymentMethod,
  guarantee,
  setGuarantee,
  guaranteeType,
  setGuaranteeType,
}: CashPaymentSummaryProps) {
  return (
    <Card className="p-4 shadow-sm">
      {/* TOTAL A PAGAR HOY */}
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase  flex items-center gap-1">
            <Banknote className="w-3 h-3" /> Monto recibido
          </Label>
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-xs font-bold">
              S/.
            </span>
            <Input
              className="pl-7 h-9 font-semibold"
              placeholder="0.00"
              value={receivedAmount}
              onChange={(e) => setReceivedAmount(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase ">
            Método de pago
          </Label>
          <Select
            value={paymentMethod}
            onValueChange={(val) => setPaymentMethod(val as PaymentMethodType)}
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

      {type === "alquiler" && !checklist.guaranteeAfter && (
        <GuaranteeSection
          guarantee={guarantee}
          setGuarantee={setGuarantee}
          guaranteeType={guaranteeType}
          setGuaranteeType={setGuaranteeType}
        />
      )}

      {/* VUELTO (SOLO EFECTIVO) */}
      {paymentMethod === "cash" && (
        <div className="flex justify-between items-center pt-2 border-t">
          <Label className="text-[10px] font-bold uppercase flex items-center gap-1">
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

      <div className="flex justify-between items-center bg-primary/5 p-3 rounded border-l-2 border-primary">
        <div className="flex flex-col">
          <span className="text-[10px] uppercase font-bold">
            Total a pagar hoy
          </span>
          <span className="text-[11px]">Según método de pago</span>
        </div>
        <span className="text-xl font-black text-primary">
          {formatCurrency(totalToPay)}
        </span>
      </div>
    </Card>
  );
}
