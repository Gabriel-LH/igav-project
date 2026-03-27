"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, History, CreditCard } from "lucide-react";
import { SessionDataTable } from "./session-data-table";
import { PaymentDataTable } from "./payment-data-table";
import { PaymentHeader } from "./cash-stats";
import { mapPaymentsToTable } from "@/src/adapters/payment-adapter";
import {
  CashSessionTableRow,
  mapCashSessionsToTable,
} from "@/src/adapters/cash-session-adapter";
import {
  PaymentDatePreset,
  filterPaymentsByDate,
  getPeriodLabel,
} from "@/src/utils/cash/cashPayment";
import { OpenSessionModal } from "./ui/modal/OpenSessionModal";
import { CloseSessionModal } from "./ui/modal/CloseSessionModal";
import { SessionDetailModal } from "./ui/modal/DetailSessionModal";
import { useBranchStore } from "@/src/store/useBranchStore";
import type { User } from "@/src/types/user/type.user";
import type { Payment } from "@/src/types/payments/type.payments";
import type { PaymentMethod } from "@/src/types/payments/type.paymentMethod";
import type { CashSession } from "@/src/types/cash/type.cash";
import type { Client } from "@/src/types/clients/type.client";
import type { Operation } from "@/src/types/operation/type.operations";
import {
  closeCashSessionAction,
  getCashDashboardDataAction,
  openCashSessionAction,
} from "@/src/app/(tenant)/tenant/actions/cash.actions";
import { toast } from "sonner";

const normalizePayment = (payment: Payment): Payment => ({
  ...payment,
  createdAt: new Date(payment.createdAt),
  date: new Date(payment.date),
});

const normalizeSession = (session: CashSession): CashSession => ({
  ...session,
  openedAt: new Date(session.openedAt),
  closedAt: session.closedAt ? new Date(session.closedAt) : undefined,
});

const normalizeUser = (user: User): User => ({
  ...user,
  createdAt: new Date(user.createdAt),
  updatedAt: new Date(user.updatedAt),
});

export function CashLayout() {
  const [activeTab, setActiveTab] = useState("sessions");
  const [datePreset, setDatePreset] = useState<PaymentDatePreset>("today");
  const [customFrom, setCustomFrom] = useState<Date>(() => new Date());
  const [customTo, setCustomTo] = useState<Date>(() => new Date());
  const [showOpenSession, setShowOpenSession] = useState(false);
  const [showCloseSession, setShowCloseSession] = useState(false);
  const [showSessionDetail, setShowSessionDetail] = useState(false);
  const [selectedSession, setSelectedSession] =
    useState<CashSessionTableRow | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [sessions, setSessions] = useState<CashSession[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [operations, setOperations] = useState<Operation[]>([]);
  const branches = useBranchStore((state) => state.branches);

  const loadCashData = useCallback(async () => {
    const result = await getCashDashboardDataAction();

    if (!result.success || !result.data) {
      toast.error(result.error || "No se pudo cargar caja");
      return;
    }

    setSessions(result.data.sessions.map(normalizeSession));
    setPayments(result.data.payments.map(normalizePayment));
    setUsers(result.data.users.map(normalizeUser));
    setPaymentMethods(result.data.paymentMethods);
    setClients(
      result.data.clients.map((client) => ({
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt),
        deletedAt: client.deletedAt ? new Date(client.deletedAt) : null,
      })),
    );
    setOperations(
      result.data.operations.map((operation) => ({
        ...operation,
        date: new Date(operation.date),
        createdAt: new Date(operation.createdAt),
      })),
    );
  }, []);

  useEffect(() => {
    loadCashData();
  }, [loadCashData]);

  const filteredPayments = useMemo(
    () => filterPaymentsByDate(payments, datePreset, customFrom, customTo),
    [payments, datePreset, customFrom, customTo],
  );

  const paymentsData = useMemo(() => {
    return mapPaymentsToTable(
      filteredPayments,
      clients,
      operations,
      users,
      paymentMethods,
    );
  }, [filteredPayments, clients, operations, users, paymentMethods]);

  const sessionsData = useMemo(
    () => mapCashSessionsToTable(sessions, users, branches),
    [sessions, users, branches],
  );

  const periodLabel = useMemo(() => getPeriodLabel(datePreset), [datePreset]);

  const handleViewSession = useCallback((session: CashSessionTableRow) => {
    setSelectedSession(session);
    setShowSessionDetail(true);
  }, []);

  const handleCloseSession = useCallback((session: CashSessionTableRow) => {
    setSelectedSession(session);
    setShowCloseSession(true);
  }, []);

  const handleOpenSession = useCallback(
    async (input: {
      branchId: string;
      openingAmount: number;
      notes?: string;
    }) => {
      const result = await openCashSessionAction(input);

      if (!result.success || !result.data) {
        toast.error(result.error || "No se pudo abrir la caja");
        return false;
      }

      setSessions((current) => [normalizeSession(result.data), ...current]);
      toast.success("Caja abierta correctamente");
      return true;
    },
    [],
  );

  const handleConfirmClose = useCallback(
    async (countedAmount: number) => {
      if (!selectedSession) return;

      const result = await closeCashSessionAction({
        sessionId: selectedSession.id,
        countedAmount,
      });

      if (!result.success || !result.data) {
        toast.error(result.error || "No se pudo cerrar la caja");
        return;
      }

      const updatedSession = normalizeSession(result.data);
      setSessions((current) =>
        current.map((session) =>
          session.id === updatedSession.id ? updatedSession : session,
        ),
      );
      setShowCloseSession(false);
      setSelectedSession(null);
      toast.success("Caja cerrada correctamente");
    },
    [selectedSession],
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Caja</h1>
          <p className="text-muted-foreground">
            Control de sesiones y movimientos de caja
          </p>
        </div>
        <Button onClick={() => setShowOpenSession(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Abrir Caja
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="sessions" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Sesiones
          </TabsTrigger>
          <TabsTrigger value="movements" className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            Movimientos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="sessions" className="space-y-4">
          {activeTab === "sessions" && (
            <SessionDataTable
              data={sessionsData}
              onViewSession={handleViewSession}
              onCloseSession={handleCloseSession}
            />
          )}
        </TabsContent>

        <TabsContent value="movements" className="space-y-4">
          {activeTab === "movements" && (
            <>
              <PaymentHeader
                payments={filteredPayments}
                periodLabel={periodLabel}
                paymentMethods={paymentMethods}
              />

              <PaymentDataTable
                data={paymentsData}
                datePreset={datePreset}
                onDatePresetChange={setDatePreset}
                customFrom={customFrom}
                customTo={customTo}
                onCustomFromChange={setCustomFrom}
                onCustomToChange={setCustomTo}
              />
            </>
          )}
        </TabsContent>
      </Tabs>

      <OpenSessionModal
        open={showOpenSession}
        onOpenChange={setShowOpenSession}
        onSessionCreated={handleOpenSession}
        branches={branches}
        cashiers={users}
      />

      <CloseSessionModal
        open={showCloseSession}
        onOpenChange={setShowCloseSession}
        session={selectedSession}
        onConfirm={handleConfirmClose}
      />

      <SessionDetailModal
        open={showSessionDetail}
        onOpenChange={setShowSessionDetail}
        session={selectedSession}
        payments={payments}
        paymentMethods={paymentMethods}
      />
    </div>
  );
}
