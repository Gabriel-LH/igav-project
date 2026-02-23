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
  operationColumn,
  receivedByColumn,
  referenceColumn,
  remainingColumn,
  selectColumn,
  statusColumn,
  totalColumn,
} from "../column-helpers";

export const columnsPaymentCompleted: ColumnDef<PaymentRow>[] = [
  dragColumn,
  selectColumn,
  clientColumn(),
  operationColumn(),
  receivedByColumn(),
  movementColumn(),
  totalColumn,
  netPaidColumn,
  remainingColumn({ label: "Restante" }),
  categoryColumn,
  statusColumn(),
  methodColumn,
  referenceColumn,
  dateColumn(),
];
