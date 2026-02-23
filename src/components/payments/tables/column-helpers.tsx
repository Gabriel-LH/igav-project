"use client";

import { Badge } from "@/components/badge";
import { Checkbox } from "@/components/checkbox";
import { DragHandle } from "@/src/components/dashboard/data-table/ui/DragHandle";
import { formatCurrency } from "@/src/utils/currency-format";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BankIcon,
  CreditCardIcon,
  SmartPhone02Icon,
  Wallet01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { z } from "zod";
import { paymentTableSchema } from "../type/type.payments";
import { PaymentCellViewer } from "./payment-cell-viewer";

export type PaymentRow = z.infer<typeof paymentTableSchema>;

export const dragColumn: ColumnDef<PaymentRow> = {
  id: "drag",
  header: () => null,
  cell: ({ row }) => <DragHandle id={Number(row.original.id)} />,
  enableHiding: false,
};

export const selectColumn: ColumnDef<PaymentRow> = {
  id: "select",
  header: ({ table }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
      />
    </div>
  ),
  cell: ({ row }) => (
    <div className="flex items-center justify-center">
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
      />
    </div>
  ),
  enableSorting: false,
  enableHiding: false,
};

export const clientColumn = (
  extraClassName?: string,
): ColumnDef<PaymentRow> => ({
  accessorKey: "clientName",
  header: "Cliente",
  cell: ({ row }) => (
    <div className={extraClassName}>
      <PaymentCellViewer item={row.original} />
    </div>
  ),
});

export const operationColumn = (
  extraClassName?: string,
): ColumnDef<PaymentRow> => ({
  accessorKey: "operationType",
  header: "Operacion",
  cell: ({ getValue }) => (
    <div className={`w-32 ${extraClassName ?? ""}`}>{String(getValue())}</div>
  ),
});

export const receivedByColumn = (
  extraClassName?: string,
): ColumnDef<PaymentRow> => ({
  accessorKey: "receivedBy",
  header: "Registrado por",
  cell: ({ getValue }) => (
    <div className={`w-36 ${extraClassName ?? ""}`}>
      {String(getValue() || "-")}
    </div>
  ),
});

export const movementColumn = (opts?: {
  forceOut?: boolean;
  className?: string;
  label?: string;
}): ColumnDef<PaymentRow> => ({
  accessorKey: "amount",
  header: opts?.label ?? "Movimiento",
  cell: ({ row }) => {
    const isOut = opts?.forceOut || row.original.direction === "out";
    const sign = isOut ? "-" : "+";
    const tone = isOut ? "text-red-600" : "text-emerald-600";
    return (
      <div className={`w-32 font-medium ${tone} ${opts?.className ?? ""}`}>
        {sign} {formatCurrency(row.original.amount)}
      </div>
    );
  },
});

export const totalColumn: ColumnDef<PaymentRow> = {
  accessorKey: "totalAmount",
  header: "Total",
  cell: ({ getValue }) => (
    <div className="w-32 font-medium">{formatCurrency(Number(getValue()))}</div>
  ),
};

export const netPaidColumn: ColumnDef<PaymentRow> = {
  accessorKey: "netPaid",
  header: "Pagado neto",
  cell: ({ getValue }) => (
    <div className="w-32 font-medium">{formatCurrency(Number(getValue()))}</div>
  ),
};

export const remainingColumn = (opts?: {
  className?: string;
  label?: string;
}): ColumnDef<PaymentRow> => ({
  accessorKey: "remaining",
  header: opts?.label ?? "Pendiente",
  cell: ({ row }) => {
    const historicalRemaining = row.original.remaining;
    const currentRemaining = row.original.currentRemaining;

    const tone =
      historicalRemaining <= 0
        ? "text-emerald-600"
        : (opts?.className ?? "text-amber-600");

    // ¿El saldo histórico es diferente al saldo real de hoy?
    const hasChanged = historicalRemaining !== currentRemaining;

    return (
      <div className="flex flex-col justify-center w-32">
        {/* Saldo Histórico (El principal) */}
        <span className={`font-semibold ${tone}`}>
          {formatCurrency(historicalRemaining)}
        </span>

        {/* 🔥 Saldo Actual (Solo aparece si la deuda cambió por una corrección) */}
        {hasChanged && (
          <span
            className="text-[10px] text-muted-foreground font-medium"
            title="Deuda real actual"
          >
            Hoy: {formatCurrency(currentRemaining)}
          </span>
        )}
      </div>
    );
  },
});

export const categoryColumn: ColumnDef<PaymentRow> = {
  accessorKey: "category",
  header: "Categoria",
  cell: ({ row }) => {
    const labels = {
      payment: "PAGO",
      refund: "REEMBOLSO",
      correction: "CORRECCION",
    } as const;

    const hasBeenAltered = row.original.hasSubsequentCorrections;

    return (
      <div className="flex flex-col items-start gap-1 w-32">
        <Badge variant="outline" className="px-1.5">
          {labels[row.original.category]}
        </Badge>
        {/* 🔥 Si el pago fue alterado después, mostramos el badge rojo */}
        {hasBeenAltered && (
          <Badge
            variant="destructive"
            className="px-1 text-[7px] h-3 leading-none cursor-help"
            title="Esta operación sufrió reembolsos o correcciones posteriormente"
          >
            MODIFICADO
          </Badge>
        )}
      </div>
    );
  },
};

export const statusColumn = (opts?: {
  className?: string;
}): ColumnDef<PaymentRow> => ({
  accessorKey: "status",
  header: "Estado",
  cell: ({ row }) => {
    const tone =
      row.original.status === "posted"
        ? "text-emerald-600 border-emerald-600"
        : "text-amber-600 border-amber-600";

    return (
      <div className="w-32">
        <Badge
          variant="outline"
          className={`px-1.5 ${opts?.className ?? tone}`}
        >
          {row.original.status.toUpperCase()}
        </Badge>
      </div>
    );
  },
});

export const methodColumn: ColumnDef<PaymentRow> = {
  accessorKey: "method",
  header: "Metodo",
  cell: ({ row }) => {
    const type = row.original.method;
    return (
      <div className="w-32">
        <Badge variant="outline" className="text-muted-foreground px-1.5 gap-1">
          {type === "cash" ? (
            <HugeiconsIcon icon={Wallet01Icon} strokeWidth={3} />
          ) : type === "card" ? (
            <HugeiconsIcon icon={CreditCardIcon} strokeWidth={3} />
          ) : type === "transfer" ? (
            <HugeiconsIcon icon={BankIcon} strokeWidth={3} />
          ) : (
            <HugeiconsIcon icon={SmartPhone02Icon} strokeWidth={3} />
          )}
          {type.toUpperCase()}
        </Badge>
      </div>
    );
  },
};

export const referenceColumn: ColumnDef<PaymentRow> = {
  accessorKey: "reference",
  header: "Referencia",
  cell: ({ getValue }) => (
    <div className="w-40 truncate">{String(getValue() || "-")}</div>
  ),
};

export const notesColumn: ColumnDef<PaymentRow> = {
  accessorKey: "notes",
  header: "Notas",
  cell: ({ getValue }) => (
    <div className="w-44 truncate text-muted-foreground">
      {String(getValue() || "-")}
    </div>
  ),
};

export const dateColumn = (extraClassName?: string): ColumnDef<PaymentRow> => ({
  accessorKey: "date",
  header: "Fecha",
  cell: ({ getValue }) => (
    <div className={`w-32 ${extraClassName ?? ""}`}>
      {(getValue() as Date).toLocaleDateString()}
    </div>
  ),
});
