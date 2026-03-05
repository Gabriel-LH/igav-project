// components/cash/cash-layout.tsx (corregido)
"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Plus, History, CreditCard } from "lucide-react";
import { SessionsTable } from "./tables/session-table";
import { PaymentDataTable } from "./payment-data-table";
import { PaymentHeader } from "./cash-stats";
import { usePaymentStore } from "@/src/store/usePaymentStore";
import { useCashSessionStore } from "@/src/store/useCashSessionStore";
import { MOCK_BRANCHES } from "@/src/mocks/mock.branch";
import { useCustomerStore } from "@/src/store/useCustomerStore";
import { useOperationStore } from "@/src/store/useOperationStore";
import { USER_MOCK } from "@/src/mocks/mock.user";
import { mapPaymentsToTable } from "@/src/adapters/payment-adapter";
import { mapCashSessionsToTable } from "@/src/adapters/cash-session-adapter";
import {
  PaymentDatePreset,
  filterPaymentsByDate,
  getPeriodLabel,
} from "@/src/utils/cash/cashPayment";
import { OpenSessionModal } from "./ui/modal/OpenSessionModal";
import { CloseSessionModal } from "./ui/modal/CloseSessionModal";
import { SessionDetailModal } from "./ui/modal/DetailSessionModal";
import type { CashSessionTableRow } from "@/src/adapters/cash-session-adapter";

// Valores estables fuera del componente
const STABLE_BRANCHES = MOCK_BRANCHES; // Referencia estable
const STABLE_USERS = USER_MOCK; // Referencia estable

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

  // Stores
  const { payments } = usePaymentStore();
  const { sessions, loadSessions, addSession, closeSession } =
    useCashSessionStore();
  const { customers } = useCustomerStore();
  const { operations } = useOperationStore();

  // Cargar datos iniciales (solo una vez)
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadSessions()]);
    };

    loadData();
  }, [loadSessions]); // Dependencias estables

  // Filtrar pagos por fecha - con useMemo optimizado
  const filteredPayments = useMemo(
    () => filterPaymentsByDate(payments, datePreset, customFrom, customTo),
    [payments, datePreset, customFrom, customTo], // Solo cambiar cuando estas dependencias cambien
  );

  // Datos para tabla de pagos - con referencias estables
  const paymentsData = useMemo(() => {
    // customers y operations son objetos/arrays de stores, necesitamos asegurar referencias
    const customersArray = customers ? Object.values(customers) : [];
    const operationsArray = operations ? Object.values(operations) : [];

    return mapPaymentsToTable(
      filteredPayments,
      customersArray,
      operationsArray,
      STABLE_USERS,
    );
  }, [filteredPayments, customers, operations]); // customers y operations son de stores, pueden cambiar

  // Datos para tabla de sesiones - con referencias estables
  const sessionsData = useMemo(
    () => mapCashSessionsToTable(sessions, STABLE_USERS, STABLE_BRANCHES),
    [sessions], // Solo depende de sessions
  );

  const periodLabel = useMemo(() => getPeriodLabel(datePreset), [datePreset]);

  // Handlers con useCallback para evitar recreación
  const handleViewSession = useCallback((session: CashSessionTableRow) => {
    setSelectedSession(session);
    setShowSessionDetail(true);
  }, []);

  const handleCloseSession = useCallback((session: CashSessionTableRow) => {
    setSelectedSession(session);
    setShowCloseSession(true);
  }, []);

  const handleConfirmClose = useCallback(
    (countedAmount: number) => {
      if (selectedSession) {
        closeSession(selectedSession.id, countedAmount);
        setShowCloseSession(false);
        setSelectedSession(null);
      }
    },
    [selectedSession, closeSession],
  );

  return (
    <div className="flex flex-1 flex-col gap-6">
      {/* Header con título y botón de abrir sesión */}
      <div className="flex justify-between items-center">
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

      {/* Tabs principales */}
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

        {/* Tab de Sesiones */}
        <TabsContent value="sessions" className="space-y-4">
          {activeTab === "sessions" && (
            <SessionsTable
              data={sessionsData}
              onViewSession={handleViewSession}
              onCloseSession={handleCloseSession}
            />
          )}
        </TabsContent>

        {/* Tab de Movimientos */}
        <TabsContent value="movements" className="space-y-4">
          {activeTab === "movements" && (
            <>
              <PaymentHeader
                payments={filteredPayments}
                periodLabel={periodLabel}
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

      {/* Modales */}
      <OpenSessionModal
        open={showOpenSession}
        onOpenChange={setShowOpenSession}
        onSessionCreated={addSession}
        branches={STABLE_BRANCHES}
        cashiers={STABLE_USERS}
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
        payments={filteredPayments}
      />
    </div>
  );
}
