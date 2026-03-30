// components/cash/ui/modal/CloseSessionModal.tsx
"use client";

import { useState} from "react";
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalDescription,
  CustomModalFooter,
} from "../custom/CustomModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatCurrency } from "@/src/utils/currency-format";
import { AlertCircle, DollarSign, Calculator } from "lucide-react";
import type { CashSessionTableRow } from "@/src/adapters/cash-session-adapter";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";

interface CloseSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  session: CashSessionTableRow | null;
  onConfirm: (countedAmount: number) => void | Promise<void>;
  tenantConfig: TenantConfig | null;
}

export function CloseSessionModal({
  open,
  onOpenChange,
  session,
  onConfirm,
  tenantConfig,
}: CloseSessionModalProps) {
  const [countedAmount, setCountedAmount] = useState<number>(0);
  const [error, setError] = useState<string>("");


  if (!session) return null;

  const expectedAmount = session.expectedAmount || 0;
  const difference = countedAmount - expectedAmount;

  const handleSubmit = () => {
    if (countedAmount < 0) {
      setError("El monto contado no puede ser negativo");
      return;
    }

    if (tenantConfig?.cash.requireClosingReport && (countedAmount === null || countedAmount === undefined)) {
      setError("El reporte de cierre detallado es obligatorio por configuración.");
      return;
    }

    onConfirm(countedAmount);
  };

  return (
    <CustomModal
      open={open}
      onOpenChange={onOpenChange}
      className="sm:max-w-[500px]"
    >
      <CustomModalHeader>
        <CustomModalTitle className="flex items-center gap-2 text-xl">
          <Calculator className="h-5 w-5" />
          Cerrar Sesión de Caja
        </CustomModalTitle>
        <CustomModalDescription>
          Sesión #{session.sessionNumber} - {session.branchName}
        </CustomModalDescription>
      </CustomModalHeader>

      <div className="space-y-6 py-4">
        {/* Resumen de la sesión */}
        <div className="bg-muted/50 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Cajero:</span>
            <span className="font-medium">{session.cashierName}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Apertura:</span>
            <span className="font-medium">
              {session.openedAt.toLocaleString()}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Monto inicial:</span>
            <span className="font-medium">
              {formatCurrency(session.openingAmount)}
            </span>
          </div>
        </div>

        {/* Monto esperado */}
        <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-blue-600" />
            <span className="font-medium text-blue-700 dark:text-blue-300">
              Efectivo esperado
            </span>
          </div>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(expectedAmount)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Calculado según movimientos del sistema
          </p>
        </div>

        <div className="space-y-3">
          <Label htmlFor="counted" className="text-base flex items-center gap-1">
            Efectivo contado
            {tenantConfig?.cash.requireClosingReport && (
              <span className="text-destructive font-bold">*</span>
            )}
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1.5 text-muted-foreground">
              S/
            </span>
            <Input
              id="counted"
              type="number"
              min="0"
              step="0.01"
              value={countedAmount}
              onChange={(e) =>
                setCountedAmount(parseFloat(e.target.value) || 0)
              }
              className="pl-8 text-lg font-medium"
              placeholder="0.00"
            />
          </div>
        </div>

        {/* Diferencia */}
        {countedAmount > 0 && (
          <div
            className={`rounded-lg p-4 ${
              difference === 0
                ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800"
                : difference > 0
                  ? "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800"
                  : "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800"
            } border`}
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">Diferencia:</span>
              <span
                className={`text-xl font-bold ${
                  difference === 0
                    ? "text-green-600"
                    : difference > 0
                      ? "text-amber-600"
                      : "text-red-600"
                }`}
              >
                {difference > 0 ? "+" : ""}
                {formatCurrency(difference)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {difference === 0 && "Cuadra perfecto"}
              {difference > 0 && "Sobra efectivo en caja"}
              {difference < 0 && "Falta efectivo en caja"}
            </p>
          </div>
        )}

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Alert
          variant="default"
          className="border-amber-500 bg-amber-50 dark:bg-amber-950/20"
        >
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            Una vez cerrada la sesión, no se podrán registrar más movimientos en
            esta caja.
          </AlertDescription>
        </Alert>
      </div>

      <CustomModalFooter className="gap-2">
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit}>Cerrar sesión</Button>
      </CustomModalFooter>
    </CustomModal>
  );
}
