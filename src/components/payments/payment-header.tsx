"use client";

import { Card, CardContent } from "@/components/card";
import { Payment } from "@/src/types/payments/type.payments";
import { formatCurrency } from "@/src/utils/currency-format";

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
  const postedPayments = payments.filter((payment) => payment.status === "posted");

  const ingresos = sumAmounts(postedPayments, (p) => p.direction === "in");
  const salidas = sumAmounts(postedPayments, (p) => p.direction === "out");
  const reembolsos = sumAmounts(postedPayments, (p) => p.category === "refund");
  const correcciones = sumAmounts(
    postedPayments,
    (p) => p.category === "correction",
  );
  const flujoNeto = ingresos - salidas;

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
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold">Pagos</h1>
        <p className="text-muted-foreground">
          Control diario de entradas y salidas de caja.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5">
        <Card className="py-4">
          <CardContent>
            <p className="text-xs text-muted-foreground">Ingresos {periodLabel}</p>
            <p className="text-xl font-semibold text-emerald-600">
              {formatCurrency(ingresos)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <p className="text-xs text-muted-foreground">Salidas {periodLabel}</p>
            <p className="text-xl font-semibold text-red-600">
              {formatCurrency(salidas)}
            </p>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent className="px-2">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">Reembolsos {periodLabel}</p>
              <p className="text-xs text-muted-foreground">Correcciones</p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-amber-600">
                {formatCurrency(reembolsos)}
              </p>

              <p className="text-xl font-semibold text-amber-600">
                {formatCurrency(correcciones)}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="py-4">
          <CardContent>
            <p className="text-xs text-muted-foreground">Flujo neto {periodLabel}</p>
            <p
              className={`text-xl font-semibold ${
                flujoNeto >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatCurrency(flujoNeto)}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 md:grid-cols-4 xl:grid-cols-5">
        {methodStats.map((item) => (
          <Card key={item.method} className="py-4">
            <CardContent className=" space-y-1">
              <p className="text-xs uppercase text-muted-foreground">
                {item.method}
              </p>

              <div className="flex items-center gap-2">
                {item.ingresos > 0 && (
                  <p className="text-sm font-medium text-emerald-600">
                    + {formatCurrency(item.ingresos)}
                  </p>
                )}

                {item.salidas > 0 && (
                  <p className="text-sm font-medium text-red-600">
                    - {formatCurrency(item.salidas)}
                  </p>
                )}

                {item.ingresos === 0 && item.salidas === 0 && (
                  <p className="text-sm text-muted-foreground">
                    Sin movimientos
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
