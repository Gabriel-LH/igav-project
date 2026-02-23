"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  PaymentRow,
  categoryColumn,
  clientColumn,
  dateColumn,
  dragColumn,
  methodColumn,
  movementColumn,
  netPaidColumn,
  notesColumn,
  operationColumn,
  receivedByColumn,
  referenceColumn,
  remainingColumn,
  selectColumn,
  statusColumn,
} from "../column-helpers";

export const columnsPaymentCanceled: ColumnDef<PaymentRow>[] = [
  dragColumn,
  selectColumn,
  clientColumn("opacity-70 line-through"),
  operationColumn("opacity-70"),
  receivedByColumn("opacity-70"),
  movementColumn({ className: "line-through opacity-70" }),
  netPaidColumn,
  remainingColumn({ label: "Restante", className: "text-muted-foreground" }),
  categoryColumn,
  statusColumn({ className: "text-yellow-700 border-yellow-700" }),
  methodColumn,
  referenceColumn,
  notesColumn,
  dateColumn("text-yellow-700"),
];
