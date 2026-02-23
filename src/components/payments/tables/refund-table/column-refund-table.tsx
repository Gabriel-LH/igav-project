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
  remainingColumn,
  selectColumn,
  statusColumn,
} from "../column-helpers";

export const columnsPaymentRefund: ColumnDef<PaymentRow>[] = [
  dragColumn,
  selectColumn,
  clientColumn(),
  operationColumn(),
  receivedByColumn(),
  movementColumn({ forceOut: true, label: "Reembolso" }),
  netPaidColumn,
  remainingColumn({ label: "Restante" }),
  categoryColumn,
  statusColumn({ className: "text-red-600 border-red-600" }),
  methodColumn,
  notesColumn,
  dateColumn(),
];
