import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Wallet, CreditCard, Smartphone, Banknote, HandCoins } from "lucide-react";
import { Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/checkbox";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";

interface Props {
  amountPaid: number | string;
  setAmountPaid: (v: string) => void;
  downPayment: number | string;
  setDownPayment: (v: string) => void;
  paymentMethodId: string;
  setPaymentMethodId: (v: string) => void;
  paymentMethods: PaymentMethod[];
  isCashPayment: boolean;
  keepAsCredit: boolean;
  setKeepAsCredit: (v: boolean) => void;
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

export function ReservationPaymentSummary({
  amountPaid,
  setAmountPaid,
  downPayment,
  setDownPayment,
  paymentMethodId,
  setPaymentMethodId,
  paymentMethods,
  isCashPayment,
  keepAsCredit,
  setKeepAsCredit,
}: Props) {
  const changeAmount =
    isCashPayment
      ? Math.max(Number(amountPaid) - Number(downPayment), 0)
      : 0;

  return (
    <Card className="p-4 space-y-1 shadow-sm">
      <div className="flex justify-between">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase">
            <Banknote className="w-3 h-3" />
            Adelanto
          </Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              S/.
            </span>
            <Input
              placeholder="0.00"
              className="h-9 font-semibold pl-6"
              value={downPayment}
              onChange={(e) => setDownPayment(e.target.value)}
            />
          </div>
        </div>

        {/* MÉTODO DE PAGO */}
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase">
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

      {/* MONTO ENTREGADO */}
      <div className="flex justify-between">
        <div className="space-y-2">
          <Label className="text-[10px] font-bold uppercase">
            <Banknote className="w-3 h-3" />
            Monto entregado
          </Label>
          <div className="relative">
            <span className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
              S/.
            </span>
            <Input
              placeholder="0.00"
              className="h-9 font-bold pl-6"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-2">
          {isCashPayment && (
            <div className="flex flex-col justify-end gap-2 text-sm font-bold">
              <Label className="text-[10px] font-bold uppercase">
                <HandCoins className="w-3 h-3" />
                Vuelto
              </Label>
              <div
                className={
                  changeAmount > 0
                    ? "text-emerald-500 border h-9 flex items-center justify-center rounded-md px-2 bg-muted/80"
                    : "text-muted-foreground"
                }
              >
                <span>S/. {changeAmount.toFixed(2)}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="w-full -mt-2">
        {isCashPayment && changeAmount > 0 && (
          <FieldGroup>
            <Field orientation="horizontal">
              <Checkbox
                id="credit-check"
                checked={keepAsCredit}
                onCheckedChange={(checked) =>
                  setKeepAsCredit(checked as boolean)
                }
              />
              <Label
                htmlFor="credit-check"
                className="text-[11px] font-medium text-blue-400"
              >
                ¿Dejar excedente como crédito a favor del cliente?
              </Label>
            </Field>
          </FieldGroup>
        )}
      </div>
    </Card>
  );
}
