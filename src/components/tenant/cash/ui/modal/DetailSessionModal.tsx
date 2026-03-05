// components/cash/ui/modal/SessionDetailModal.tsx
"use client";

import { useMemo } from "react";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
} from "../custom/CustomModal";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/badge";
import { Separator } from "@/components/ui/separator";
import { formatCurrency } from "@/src/utils/currency-format";
import {
  Calendar,
  Clock,
  User,
  MapPin,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Wallet,
} from "lucide-react";
import type { CashSessionTableRow } from "@/src/adapters/cash-session-adapter";
import type { Payment } from "@/src/types/payments/type.payments";

interface SessionDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CashSessionTableRow | null;
  payments: Payment[];
}

export function SessionDetailModal({
  open,
  onOpenChange,
  session,
  payments,
}: SessionDetailModalProps) {
  if (!session) return null;

  // Filtrar pagos de esta sesión
  const sessionPayments = useMemo(() => {
    // Aquí deberías filtrar por sessionId si tu modelo de Payment tiene ese campo
    // Por ahora, simulamos algunos pagos
    return payments.slice(0, 5);
  }, [payments]);

  const ingresos = sessionPayments
    .filter((p) => p.direction === "in")
    .reduce((sum, p) => sum + p.amount, 0);

  const salidas = sessionPayments
    .filter((p) => p.direction === "out")
    .reduce((sum, p) => sum + p.amount, 0);

  const formatDateTime = (date: Date | null) => {
    if (!date) return "—";
    return new Intl.DateTimeFormat("es-PE", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(date);
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
    >
      <CustomModalHeader>
        <CustomModalTitle className="flex items-center gap-2 text-xl">
          <Receipt className="h-5 w-5" />
          Detalle de Sesión #{session.sessionNumber}
        </CustomModalTitle>
      </CustomModalHeader>

      <div className="space-y-6">
        {/* Información general */}
        <div className="grid grid-cols-2 gap-4 bg-muted/30 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Sucursal</p>
              <p className="font-medium">{session.branchName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cajero</p>
              <p className="font-medium">{session.cashierName}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Apertura</p>
              <p className="font-medium">{formatDateTime(session.openedAt)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Cierre</p>
              <p className="font-medium">{formatDateTime(session.closedAt)}</p>
            </div>
          </div>
        </div>

        {/* Estado y montos */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Monto inicial</p>
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {formatCurrency(session.openingAmount)}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Esperado</p>
            <p className="text-xl font-bold text-green-600 dark:text-green-400">
              {formatCurrency(session.expectedAmount || 0)}
            </p>
          </div>
          <div
            className={`p-4 rounded-lg text-center ${
              !session.difference
                ? "bg-gray-50 dark:bg-gray-900"
                : session.difference > 0
                  ? "bg-amber-50 dark:bg-amber-950/20"
                  : "bg-red-50 dark:bg-red-950/20"
            }`}
          >
            <p className="text-xs text-muted-foreground mb-1">Diferencia</p>
            <p className={`text-xl font-bold ${session.differenceColor}`}>
              {session.formattedDifference}
            </p>
          </div>
        </div>

        {/* Resumen de movimientos */}
        <div className="grid grid-cols-2 gap-4">
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              <span className="font-medium">Ingresos</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">
              {formatCurrency(ingresos)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sessionPayments.filter((p) => p.direction === "in").length}{" "}
              transacciones
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown className="h-4 w-4 text-red-600" />
              <span className="font-medium">Salidas</span>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(salidas)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {sessionPayments.filter((p) => p.direction === "out").length}{" "}
              transacciones
            </p>
          </div>
        </div>

        <Separator />

        {/* Lista de movimientos */}
        <div>
          <h3 className="font-medium mb-3 flex items-center gap-2">
            <Wallet className="h-4 w-4" />
            Movimientos de la sesión
          </h3>

          {sessionPayments.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Hora</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Concepto</TableHead>
                    <TableHead>Método</TableHead>
                    <TableHead className="text-right">Monto</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sessionPayments.map((payment, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        {new Date(payment.date).toLocaleTimeString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {payment.reference || "—"}
                      </TableCell>
                      <TableCell>
                        {payment.category === "refund"
                          ? "Reembolso"
                          : payment.category === "correction"
                            ? "Corrección"
                            : "Pago"}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="uppercase">
                          {payment.paymentMethodId}
                        </Badge>
                      </TableCell>
                      <TableCell
                        className={`text-right font-medium ${
                          payment.direction === "in"
                            ? "text-emerald-600"
                            : "text-red-600"
                        }`}
                      >
                        {payment.direction === "in" ? "+" : "-"}
                        {formatCurrency(payment.amount)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground border rounded-lg">
              <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No hay movimientos registrados en esta sesión</p>
            </div>
          )}
        </div>

        {/* Notas */}
        {session.notes && (
          <>
            <Separator />
            <div>
              <h3 className="font-medium mb-2">Notas</h3>
              <p className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-lg">
                {session.notes}
              </p>
            </div>
          </>
        )}
      </div>
    </CustomModal>
  );
}
