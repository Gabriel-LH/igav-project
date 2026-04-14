import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/src/utils/currency-format";
import { Label } from "@/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Banknote, Coins, CreditCard, Smartphone, Wallet } from "lucide-react";
import { Input } from "@/components/input";
import { Field, FieldGroup } from "@/components/ui/field";
import { Checkbox } from "@/components/checkbox";
import { PaymentMethodType } from "@/src/utils/status-type/PaymentMethodType";

interface AddPaymentFormProps {
  remainingBalance: number;
  clientBalance: number;
  onSave: (paymentData: any) => void;
  onCancel: () => void;
}

export function AddPaymentForm({
  remainingBalance,
  clientBalance,
  onSave,
  onCancel,
}: AddPaymentFormProps) {
  const [amount, setAmount] = useState(remainingBalance);
  const [method, setMethod] = useState("cash");
  const [received, setReceived] = useState("");
  const [change, setChange] = useState(0);
  const [isCredit, setIsCredit] = useState(false); // ¿Se queda como crédito?

  // Cálculo automático del vuelto
  useEffect(() => {
    if (method === "cash" && Number(received) > Number(amount)) {
      setChange(Number(received) - Number(amount));
    } else {
      setChange(0);
    }
  }, [received, amount, method]);

  const handleMethodChange = (val: string) => {
    const newMethod = val as PaymentMethodType;
    setMethod(newMethod);

    if (newMethod === "credit") {
      const parsedRemaining = Number(remainingBalance) || 0;
      const parsedClient = Number(clientBalance) || 0;
      const suggestedAmount = Math.min(parsedRemaining, parsedClient);
      setAmount(suggestedAmount);
      setIsCredit(false);
    }
  };

  const handleSubmit = () => {
    onSave({
      amount: isCredit ? Number(received) : Number(amount),
      receivedAmount: method === "cash" ? Number(received) : Number(amount),
      changeAmount: isCredit ? 0 : Number(change),
      method,
      date: new Date(),
      type: "alquiler", // Por defecto es abono de alquiler
    });
  };

  return (
    <div className="bg-muted/50 p-4 rounded-xl border space-y-4 animate-in fade-in zoom-in-95">
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-bold text-cyan-500">
          Registrar Nuevo Abono
        </h4>
        <Button
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="h-6 text-[10px]"
        >
          Cancelar
        </Button>
      </div>

      <div className="flex justify-between gap-3">
        {/* Monto a abonar */}
        <div className="space-y-1">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Monto a pagar
          </Label>
          <div className="relative">
            <span className="absolute left-2 font-bold top-1/2 -translate-y-1/2 text-gray-500">
              S/.
            </span>
            <Input
              value={amount}
              placeholder="0.00"
              onChange={(e) => setAmount(Number(e.target.value))}
              className="pl-8 h-9 font-bold"
            />
          </div>
        </div>

        {/* Método de pago */}
        <div className="space-y-1 mt-1">
          <Label className="text-[10px] font-bold uppercase text-muted-foreground">
            Método de pago
          </Label>
          <Select
            value={method}
            onValueChange={handleMethodChange}
          >
            <SelectTrigger className="h-9 text-[11px] font-bold">
              <SelectValue placeholder="Seleccionar..." />
            </SelectTrigger>
            <SelectContent className="text-[11px]" portal={false} position="popper">
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
              <SelectItem value="credit">
                <Coins className="w-3 h-3 mr-1 inline" /> Crédito
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {method === "cash" && (
        <div className="grid grid-cols-2 gap-3 p-3  rounded-lg border border-gray-600">
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              Monto Recibido
            </Label>
            <div className="relative">
              <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500">
                S/.
              </span>
              <Input
                placeholder="0.00"
                onChange={(e) => setReceived(e.target.value)}
                className="pl-8 h-9 font-bold"
              />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-[10px] font-bold uppercase text-muted-foreground">
              Vuelto a entregar
            </Label>
            <p className="text-lg font-semibold px-1">
              {formatCurrency(change)}
            </p>
          </div>
        </div>
      )}

      {method === "credit" && (
        <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold uppercase text-blue-400">
              Crédito Disponible
            </span>
            <span className="text-sm font-black text-blue-500">
              {formatCurrency(clientBalance)}
            </span>
          </div>
          {amount > clientBalance && (
            <p className="text-[10px] text-red-500 font-bold mt-1">
              ⚠️ El monto supera el crédito disponible
            </p>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 p-2 rounded-lg">
        <FieldGroup>
          <Field orientation="horizontal">
            <Checkbox
              id="credit-check"
              checked={isCredit}
              onCheckedChange={(checked) => setIsCredit(checked as boolean)}
            />
            <Label
              htmlFor="credit-check"
              className="text-[11px] font-medium text-blue-400"
            >
              ¿Dejar excedente como crédito a favor del cliente?
            </Label>
          </Field>
        </FieldGroup>
      </div>

      <Button
        onClick={handleSubmit}
        className="w-full bg-orange-600/60 hover:bg-orange-700 text-white/70 font-black uppercase tracking-tight"
      >
        Confirmar y Registrar Pago
      </Button>
    </div>
  );
}
