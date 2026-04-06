import React from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
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
import { GuaranteeType } from "@/src/utils/status-type/GuaranteeType";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

interface CashPaymentSummaryProps {
  checklist?: {
    deliverAfter: boolean;
    guaranteeAfter: boolean;
  };
  type?: string;
  totalToPay: number;
  paymentMethodId: string;
  paymentMethods: PaymentMethod[];
  isCashPayment: boolean;
  receivedAmount: string;
  setReceivedAmount: (v: string) => void;
  changeAmount: number;
  setPaymentMethodId: (v: string) => void;
  guarantee: string;
  setGuarantee: (v: string) => void;
  guaranteeType: GuaranteeType;
  setGuaranteeType: (v: GuaranteeType) => void;
}

const getPaymentMethodIcon = (method: PaymentMethod) => {
  const normalizedName = method.name.trim().toLowerCase();

  if (method.type === "cash") return Wallet;
  if (method.type === "card") return CreditCard;
  if (normalizedName.includes("yape") || normalizedName.includes("plin")) {
    return Smartphone;
  }

  return Banknote;
};

export function CashPaymentSummary({
  checklist,
  type,
  totalToPay,
  paymentMethodId,
  paymentMethods,
  isCashPayment,
  receivedAmount,
  setReceivedAmount,
  changeAmount,
  setPaymentMethodId,
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
          <div className="relative flex items-center gap-2">
            <div className="relative flex-1">
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
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-9 text-[10px] uppercase font-bold text-primary border-primary/20 hover:bg-primary/5 shrink-0"
              onClick={() => setReceivedAmount(totalToPay.toFixed(2))}
            >
              Exacto
            </Button>
          </div>
        </div>
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase ">
            Método de pago
          </Label>
          <Select
            value={paymentMethodId}
            onValueChange={setPaymentMethodId}
          >
            <SelectTrigger className="h-9 text-[11px] font-bold">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent className="text-[11px]">
              {paymentMethods.map((method) => {
                const Icon = getPaymentMethodIcon(method);
                return (
                  <SelectItem key={method.id} value={method.id}>
                    <Icon className="w-3 h-3 mr-1 inline" /> {method.name}
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      {type === "alquiler" && !checklist?.guaranteeAfter && (
        <GuaranteeSection
          guarantee={guarantee}
          setGuarantee={setGuarantee}
          guaranteeType={guaranteeType}
          setGuaranteeType={setGuaranteeType}
        />
      )}

      {/* VUELTO (SOLO EFECTIVO) */}
      {isCashPayment && (
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
