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
  notesColumn,
  operationColumn,
  receivedByColumn,
  referenceColumn,
  selectColumn,
  statusColumn,
} from "./column-helpers";

export const columnsPaymentsUnified: ColumnDef<PaymentRow>[] = [
  dragColumn,
  selectColumn,
  clientColumn(),
  dateColumn(),
  operationColumn(),
  receivedByColumn(),
  movementColumn,
  categoryColumn,
  statusColumn,
  methodColumn,
  referenceColumn,
  notesColumn,
];
