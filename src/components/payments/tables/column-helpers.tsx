"use client";

import { Badge } from "@/components/badge";
import { Checkbox } from "@/components/checkbox";
import { DragHandle } from "@/src/components/dashboard/data-table/ui/DragHandle";
import { type ColumnDef } from "@tanstack/react-table";
import {
  BankIcon,
  Calendar03Icon,
  CreditCardIcon,
  Repeat,
  SaleTag01Icon,
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

export const dateColumn = (extraClassName?: string): ColumnDef<PaymentRow> => ({
  accessorKey: "date",
  header: "Fecha y Hora",
  cell: ({ getValue }) => {
    const dateValue = getValue() as Date;

    // Formateamos la hora (ej: "14:30" o "02:30 PM")
    const time = dateValue.toLocaleTimeString("es-PE", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Ponlo en false si prefieres formato 24h
    });

    // Formateamos la fecha corta (ej: "01/01/2026")
    const date = dateValue.toLocaleDateString("es-PE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric", // Puedes usar '2-digit' para que ocupe menos (26 en vez de 2026)
    });

    return (
      <div className={`flex flex-col w-32 ${extraClassName ?? ""}`}>
        <span className="font-medium text-sm text-slate-400">{time}</span>
        <span className="text-[10px] text-muted-foreground">{date}</span>
      </div>
    );
  },
});

export const operationColumn = (
  extraClassName?: string,
): ColumnDef<PaymentRow> => ({
  accessorKey: "operationType",
  header: "Operacion",
  cell: ({ getValue }) => {
    const operationType = getValue() as string;
    return (
      <div className={`w-32 ${extraClassName ?? ""}`}>
        {operationType}
      </div>
    );
  },
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

export const movementColumn: ColumnDef<PaymentRow> = {
  accessorKey: "amount",
  header: "Movimiento",
  cell: ({ row }) => {
    const isOut = row.original.direction === "out";
    const sign = isOut ? "-" : "+";
    const tone = isOut ? "text-red-600" : "text-emerald-600";

    return (
      <div className={`w-32 font-semibold ${tone}`}>
        {`${sign} S/ ${row.original.amount.toFixed(2)}`}
      </div>
    );
  },
};

export const categoryColumn: ColumnDef<PaymentRow> = {
  accessorKey: "category",
  header: "Categoria",
  cell: ({ row }) => {
    const labels = {
      payment: "PAGO",
      refund: "REEMBOLSO",
      correction: "CORRECCION",
    } as const;

    const badgeStyle =
      row.original.category === "payment"
        ? ""
        : row.original.category === "refund"
          ? "bg-destructive text-white border-transparent"
          : "bg-amber-100 text-amber-800 border-amber-200";

    return (
      <div className="w-32">
        <Badge variant="outline" className={`px-1.5 ${badgeStyle}`}>
          {labels[row.original.category]}
        </Badge>
      </div>
    );
  },
};

export const statusColumn: ColumnDef<PaymentRow> = {
  accessorKey: "status",
  header: "Estado",
  cell: ({ row }) => {
    const tone =
      row.original.status === "posted"
        ? "text-emerald-600 border-emerald-600"
        : "text-amber-600 border-amber-600";

    return (
      <div className="w-32">
        <Badge variant="outline" className={`px-1.5 ${tone}`}>
          {row.original.status.toUpperCase()}
        </Badge>
      </div>
    );
  },
};

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
