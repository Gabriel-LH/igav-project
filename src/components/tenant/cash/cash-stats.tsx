"use client";

import { Card, CardContent } from "@/components/ui/card";
import { PaymentMethod } from "@/src/types/payments/type.paymentMethod";
import { Payment } from "@/src/types/payments/type.payments";
import { formatCurrency } from "@/src/utils/currency-format";
import {
  ArrowUpDown,
  Banknote,
  CreditCard,
  DollarSign,
  Landmark,
  Smartphone,
  TrendingDown,
  TrendingUp,
  Wallet,
} from "lucide-react";

const sumAmounts = (
  source: Payment[],
  predicate: (payment: Payment) => boolean,
) =>
  source.reduce(
    (total, payment) => (predicate(payment) ? total + payment.amount : total),
    0,
  );

const normalizeMethodLabel = (
  methodId: string,
  paymentMethods: PaymentMethod[],
) => {
  const configuredMethod = paymentMethods.find((method) => method.id === methodId);
  if (configuredMethod?.name) return configuredMethod.name;

  const value = methodId.trim().toLowerCase();

  if (value === "cash") return "Efectivo";
  if (value === "card") return "Tarjeta";
  if (value === "transfer") return "Transferencia";
  if (value === "yape") return "Yape";
  if (value === "plin") return "Plin";

  return methodId
    .split(/[_\-\s]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
};

const getMethodIcon = (methodId: string) => {
  const value = methodId.trim().toLowerCase();

  if (value === "cash") return Banknote;
  if (value === "card") return CreditCard;
  if (value === "transfer") return Landmark;
  if (value === "yape" || value === "plin") return Smartphone;
  return Wallet;
};

export function PaymentHeader({
  payments = [],
  periodLabel,
  paymentMethods = [],
}: {
  payments?: Payment[];
  periodLabel: string;
  paymentMethods?: PaymentMethod[];
}) {
  const postedPayments = payments.filter(
    (payment) => payment.status === "posted",
  );

  const ingresos = sumAmounts(postedPayments, (payment) => payment.direction === "in");
  const salidas = sumAmounts(postedPayments, (payment) => payment.direction === "out");
  const reembolsos = sumAmounts(
    postedPayments,
    (payment) => payment.category === "refund",
  );
  const correcciones = sumAmounts(
    postedPayments,
    (payment) => payment.category === "correction",
  );
  const flujoNeto = ingresos - salidas;

  const uniqueMethods = Array.from(
    new Set(postedPayments.map((payment) => payment.paymentMethodId).filter(Boolean)),
  );

  const efectivoNeto = postedPayments.reduce((total, payment) => {
    if (payment.paymentMethodId !== "cash") return total;
    return payment.direction === "in"
      ? total + payment.amount
      : total - payment.amount;
  }, 0);

  const methodStats = uniqueMethods.map((method) => {
    const ingresosMetodo = sumAmounts(
      postedPayments,
      (payment) =>
        payment.direction === "in" && payment.paymentMethodId === method,
    );
    const salidasMetodo = sumAmounts(
      postedPayments,
      (payment) =>
        payment.direction === "out" && payment.paymentMethodId === method,
    );

    return {
      method,
      label: normalizeMethodLabel(method, paymentMethods),
      ingresos: ingresosMetodo,
      salidas: salidasMetodo,
      neto: ingresosMetodo - salidasMetodo,
      Icon: getMethodIcon(method),
    };
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="py-4">
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <span className="text-xs text-muted-foreground">
                Ingresos {periodLabel}
              </span>
            </div>
            <p className="text-xl font-semibold text-emerald-600">
              {formatCurrency(ingresos)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingDown className="h-4 w-4 text-red-500" />
              <p className="text-xs text-muted-foreground">
                Salidas {periodLabel}
              </p>
            </div>
            <p className="text-xl font-semibold text-red-600">
              {formatCurrency(salidas)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-amber-500" />
              <p className="text-xs text-muted-foreground">Reembolsos</p>
            </div>
            <p className="text-xl font-semibold text-amber-600">
              {formatCurrency(reembolsos)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <div className="flex items-center gap-2">
              <ArrowUpDown className="h-4 w-4 text-blue-500" />
              <p className="text-xs text-muted-foreground">Correcciones</p>
            </div>
            <p className="text-xl font-semibold text-blue-600">
              {formatCurrency(correcciones)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Card className="border-blue-200 bg-blue-50/50 py-4 dark:border-blue-800 dark:bg-blue-950/20">
          <CardContent>
            <div className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-600" />
              <p className="text-xs text-muted-foreground">
                Flujo total neto {periodLabel}
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${
                flujoNeto >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(flujoNeto)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Ingresos - Salidas (todos los metodos)
            </p>
          </CardContent>
        </Card>

        <Card className="border-green-200 bg-green-50/50 py-4 dark:border-green-800 dark:bg-green-950/20">
          <CardContent>
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-green-600" />
              <p className="text-xs text-muted-foreground">
                Efectivo en caja {periodLabel}
              </p>
            </div>
            <p
              className={`text-2xl font-bold ${
                efectivoNeto >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(efectivoNeto)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Solo movimientos en efectivo
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {methodStats.map((item) => (
          <Card key={item.method} className="py-4">
            <CardContent className="space-y-2">
              <div className="text-xs font-medium uppercase text-muted-foreground">
                <span className="flex gap-2">
                  <item.Icon className="h-4 w-4" />
                  {item.label}
                </span>
              </div>

              <div className="space-y-1">
                {item.ingresos > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Ingresos:</span>
                    <span className="font-medium text-emerald-600">
                      +{formatCurrency(item.ingresos)}
                    </span>
                  </div>
                )}

                {item.salidas > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Salidas:</span>
                    <span className="font-medium text-red-600">
                      -{formatCurrency(item.salidas)}
                    </span>
                  </div>
                )}

                {item.ingresos === 0 && item.salidas === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sin movimientos
                  </p>
                )}

                {(item.ingresos > 0 || item.salidas > 0) && (
                  <div className="flex justify-between border-t pt-1 text-sm font-medium">
                    <span>Neto:</span>
                    <span
                      className={
                        item.neto >= 0 ? "text-emerald-600" : "text-red-600"
                      }
                    >
                      {formatCurrency(item.neto)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
