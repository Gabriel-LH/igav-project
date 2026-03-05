// components/cash/payment-header.tsx (mejorado)
"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Payment } from "@/src/types/payments/type.payments";
import { formatCurrency } from "@/src/utils/currency-format";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Wallet,
  ArrowUpDown,
} from "lucide-react";

const sumAmounts = (
  source: Payment[],
  predicate: (payment: Payment) => boolean,
) =>
  source.reduce(
    (total, payment) => (predicate(payment) ? total + payment.amount : total),
    0,
  );

export function PaymentHeader({
  payments = [],
  periodLabel,
}: {
  payments?: Payment[];
  periodLabel: string;
}) {
  const postedPayments = payments.filter(
    (payment) => payment.status === "posted",
  );

  // Totales generales
  const ingresos = sumAmounts(postedPayments, (p) => p.direction === "in");
  const salidas = sumAmounts(postedPayments, (p) => p.direction === "out");
  const reembolsos = sumAmounts(postedPayments, (p) => p.category === "refund");
  const correcciones = sumAmounts(
    postedPayments,
    (p) => p.category === "correction",
  );
  const flujoNeto = ingresos - salidas;

  // Efectivo en caja (solo método cash)
  const ingresosEfectivo = sumAmounts(
    postedPayments,
    (p) => p.direction === "in" && p.method === "cash",
  );
  const salidasEfectivo = sumAmounts(
    postedPayments,
    (p) => p.direction === "out" && p.method === "cash",
  );
  const efectivoNeto = ingresosEfectivo - salidasEfectivo;

  // Stats por método
  const methods = ["cash", "yape", "plin", "transfer", "card"] as const;

  const methodStats = methods.map((method) => {
    const ingresosMethod = sumAmounts(
      postedPayments,
      (p) => p.direction === "in" && p.method === method,
    );

    const salidasMethod = sumAmounts(
      postedPayments,
      (p) => p.direction === "out" && p.method === method,
    );

    return {
      method,
      ingresos: ingresosMethod,
      salidas: salidasMethod,
      neto: ingresosMethod - salidasMethod,
    };
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Fila 1: Totales generales */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card className="py-4">
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-emerald-500" />
              <p className="text-xs text-muted-foreground">
                Ingresos {periodLabel}
              </p>
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

      {/* Fila 2: Flujo total vs Efectivo en caja */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="py-4 bg-blue-50/50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
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
            <p className="text-xs text-muted-foreground mt-1">
              Ingresos - Salidas (todos los métodos)
            </p>
          </CardContent>
        </Card>

        <Card className="py-4 bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
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
            <p className="text-xs text-muted-foreground mt-1">
              Solo movimientos en efectivo
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Fila 3: Stats por método */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
        {methodStats.map((item) => (
          <Card key={item.method} className="py-4">
            <CardContent className="space-y-2">
              <p className="text-xs uppercase font-medium text-muted-foreground">
                {item.method === "cash"
                  ? "💰 Efectivo"
                  : item.method === "yape"
                    ? "📱 Yape"
                    : item.method === "plin"
                      ? "📱 Plin"
                      : item.method === "transfer"
                        ? "🏦 Transferencia"
                        : "💳 Tarjeta"}
              </p>

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
                  <div className="flex justify-between text-sm font-medium pt-1 border-t">
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
