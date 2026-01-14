import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/src/utils/currency-format";

interface AddPaymentFormProps {
  remainingBalance: number;
  onSave: (paymentData: any) => void;
  onCancel: () => void;
}

export function AddPaymentForm({
  remainingBalance,
  onSave,
  onCancel,
}: AddPaymentFormProps) {
  const [amount, setAmount] = useState(remainingBalance);
  const [method, setMethod] = useState("efectivo");
  const [received, setReceived] = useState(0);
  const [change, setChange] = useState(0);
  const [isCredit, setIsCredit] = useState(false); // ¿Se queda como crédito?

  // Cálculo automático del vuelto
  useEffect(() => {
    if (method === "efectivo" && received > amount) {
      setChange(received - amount);
    } else {
      setChange(0);
    }
  }, [received, amount, method]);

  const handleSubmit = () => {
    onSave({
      amount: isCredit ? received : amount,
      receivedAmount: method === "efectivo" ? received : amount,
      changeAmount: isCredit ? 0 : change,
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

      <div className="grid grid-cols-2 gap-3">
        {/* Monto a abonar */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">
            Monto a pagar
          </label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full bg-card border rounded-lg px-3 py-2 text-sm font-bold outline-none"
          />
        </div>

        {/* Método de pago */}
        <div className="space-y-1">
          <label className="text-[10px] font-bold uppercase text-muted-foreground">
            Método
          </label>
          <select
            value={method}
            onChange={(e) => setMethod(e.target.value)}
            className="w-full bg-card border rounded-lg px-3 py-2 text-sm outline-none"
          >
            <option value="efectivo">Efectivo</option>
            <option value="transferencia">Transferencia</option>
            <option value="tarjeta">Tarjeta</option>
          </select>
        </div>
      </div>

      {method === "efectivo" && (
        <div className="grid grid-cols-2 gap-3 p-3  rounded-lg border border-gray-600">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Monto Recibido
            </label>
            <input
              type="number"
              placeholder="0.00"
              onChange={(e) => setReceived(Number(e.target.value))}
              className="w-full bg-card border-orange-300 rounded-md px-3 py-1.5 text-sm outline-none focus:border-orange-500"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase text-muted-foreground">
              Vuelto a entregar
            </label>
            <p className="text-lg font-semibold px-1">
              {formatCurrency(change)}
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 p-2 rounded-lg">
        <input
          type="checkbox"
          checked={isCredit}
          onChange={(e) => setIsCredit(e.target.checked)}
        />
        <span className="text-[11px] font-medium text-blue-400">
          ¿Dejar excedente como crédito a favor del cliente?
        </span>
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
