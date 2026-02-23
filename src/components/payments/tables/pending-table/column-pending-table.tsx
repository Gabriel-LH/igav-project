"use client";

import { type ColumnDef } from "@tanstack/react-table";
import {
  PaymentRow,
  clientColumn,
  dateColumn,
  dragColumn,
  methodColumn,
  movementColumn,
  netPaidColumn,
  notesColumn,
  operationColumn,
  receivedByColumn,
  remainingColumn,
  selectColumn,
  statusColumn,
  totalColumn,
} from "../column-helpers";

export const columnsPaymentPending: ColumnDef<PaymentRow>[] = [
  dragColumn,
  selectColumn,
  clientColumn(),
  operationColumn(),
  receivedByColumn(),
  movementColumn(),
  totalColumn,
  netPaidColumn,
  remainingColumn({ label: "Pendiente", className: "text-amber-600" }),
  statusColumn({ className: "text-amber-600 border-amber-600" }),
  methodColumn,
  notesColumn,
  dateColumn(),
];
