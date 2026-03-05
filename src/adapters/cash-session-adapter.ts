// src/adapters/cash-session-adapter.ts
import { CashSession } from "@/src/types/cash/type.cash";
import { User } from "../types/user/type.user";

export interface CashSessionTableRow {
  id: string;
  sessionNumber: string;
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;
  status: "open" | "closed";
  openedAt: Date;
  closedAt: Date | null;
  openingAmount: number;
  expectedAmount: number | null;
  countedAmount: number | null;
  difference: number | null;
  formattedDifference: string;
  differenceColor: string;
  notes?: string;
}

export function mapCashSessionsToTable(
  sessions: CashSession[],
  users: User[],
  branches: { id: string; name: string }[],
): CashSessionTableRow[] {
  return sessions.map((session) => {
    const cashier = users.find((u) => u.id === session.openedById);
    const branch = branches.find((b) => b.id === session.branchId);

    const difference = session.closingDifference ?? null;
    const differenceColor = !difference
      ? "text-gray-600"
      : difference > 0
        ? "text-green-600"
        : "text-red-600";

    return {
      id: session.id,
      sessionNumber: session.sessionNumber,
      cashierId: session.openedById,
      cashierName: cashier?.firstName || "—",
      branchId: session.branchId,
      branchName: branch?.name || "—",
      status: session.status,
      openedAt: session.openedAt,
      closedAt: session.closedAt || null,
      openingAmount: session.openingAmount,
      expectedAmount: session.closingExpectedAmount || null,
      countedAmount: session.closingCountedAmount || null,
      difference: session.closingDifference || null,
      formattedDifference: difference
        ? difference > 0
          ? `+${difference.toFixed(2)}`
          : difference.toFixed(2)
        : "—",
      differenceColor,
      notes: session.notes,
    };
  });
}
