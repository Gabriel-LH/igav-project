"use client";

import { useState } from "react";
import {
  CalendarIcon,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/separator";

import type { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";
import type { PayrollPolicy } from "@/src/types/payroll/type.payrollPolicies";
import type { PayrollItem } from "@/src/types/payroll/type.payrollItem";
import type { PayrollLineItem } from "@/src/types/payroll/type.payrollLineItem";
import type { PayrollRun } from "@/src/types/payroll/type.payrollRun";
import type { GeneratedPayrollBatchDTO } from "@/src/application/interfaces/payroll/PayrollPresentation";

interface PayrollGenerationViewProps {
  configs: PayrollConfig[];
  policy: PayrollPolicy;
  onPayrollGenerated: (payload: GeneratedPayrollBatchDTO) => void;
}

function getMonthRange(month: number, year: number) {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start, end };
}

function numberFromMembership(membershipId: string): number {
  const digits = membershipId.replace(/\D/g, "");
  return Number(digits || "1");
}

export function PayrollGenerationView({
  configs,
  policy,
  onPayrollGenerated,
}: PayrollGenerationViewProps) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const [month, setMonth] = useState<string>(String(currentMonth));
  const [year, setYear] = useState<string>(String(currentYear));
  const [branchId, setBranchId] = useState<string>("branch-main");
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<{
    success: boolean;
    generatedItems: number;
    errors: string[];
  } | null>(null);

  const months = [
    { value: "1", label: "Enero" },
    { value: "2", label: "Febrero" },
    { value: "3", label: "Marzo" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Mayo" },
    { value: "6", label: "Junio" },
    { value: "7", label: "Julio" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Septiembre" },
    { value: "10", label: "Octubre" },
    { value: "11", label: "Noviembre" },
    { value: "12", label: "Diciembre" },
  ];

  const years = [
    String(currentYear - 1),
    String(currentYear),
    String(currentYear + 1),
  ];

  const branches = [
    { value: "branch-main", label: "Sucursal Principal" },
    { value: "branch-north", label: "Sucursal Norte" },
    { value: "branch-south", label: "Sucursal Sur" },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setResult(null);

    const selectedMonth = Number(month);
    const selectedYear = Number(year);
    const { start, end } = getMonthRange(selectedMonth, selectedYear);

    const run: PayrollRun = {
      id: `pr-${selectedYear}-${String(selectedMonth).padStart(2, "0")}-${branchId}-${crypto.randomUUID().slice(0, 8)}`,
      branchId,
      periodStart: start,
      periodEnd: end,
      payDate: end,
      status: "finalized",
      createdAt: new Date(),
    };

    const generatedItems: PayrollItem[] = [];
    const generatedLineItems: PayrollLineItem[] = [];
    const errors: string[] = [];

    for (let i = 0; i < configs.length; i += 1) {
      const config = configs[i];
      try {
        const membershipSeed = numberFromMembership(config.membershipId);
        const overtimeHours = config.applyOvertime ? membershipSeed % 8 : 0;
        const regularHours = 160 + (membershipSeed % 17);

        const baseAmount =
          config.salaryType === "monthly"
            ? Number(config.baseSalary ?? 0)
            : regularHours * Number(config.hourlyRate ?? 0);

        const overtimeRate =
          config.salaryType === "monthly"
            ? (Number(config.baseSalary ?? 0) / 160) * policy.overtimeMultiplier
            : Number(config.hourlyRate ?? 0) * policy.overtimeMultiplier;
        const overtimeAmount = overtimeHours * overtimeRate;
        const grossTotal = baseAmount + overtimeAmount;

        const health =
          grossTotal * (policy.deductions.healthInsurancePercent / 100);
        const pension = grossTotal * (policy.deductions.pensionPercent / 100);
        const tax = grossTotal * (policy.deductions.taxPercent / 100);
        const deductionTotal = health + pension + tax;
        const netTotal = grossTotal - deductionTotal;

        const itemId = crypto.randomUUID();
        generatedItems.push({
          id: itemId,
          payrollRunId: run.id,
          membershipId: config.membershipId,
          grossTotal,
          deductionTotal,
          netTotal,
          status: "calculated",
        });

        generatedLineItems.push({
          id: crypto.randomUUID(),
          payrollItemId: itemId,
          type: "earning",
          category: config.salaryType === "monthly" ? "salary" : "hourly",
          name:
            config.salaryType === "monthly" ? "Sueldo base" : "Horas regulares",
          amount: baseAmount,
          quantity: config.salaryType === "hourly" ? regularHours : undefined,
          rate:
            config.salaryType === "hourly"
              ? Number(config.hourlyRate ?? 0)
              : undefined,
          createdAt: new Date(),
        });

        if (overtimeAmount > 0) {
          generatedLineItems.push({
            id: crypto.randomUUID(),
            payrollItemId: itemId,
            type: "earning",
            category: "overtime",
            name: "Horas extra",
            amount: overtimeAmount,
            quantity: overtimeHours,
            rate: overtimeRate,
            createdAt: new Date(),
          });
        }

        generatedLineItems.push(
          {
            id: crypto.randomUUID(),
            payrollItemId: itemId,
            type: "deduction",
            category: "health_insurance",
            name: "Seguro de salud",
            amount: health,
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            payrollItemId: itemId,
            type: "deduction",
            category: "pension",
            name: "Pension",
            amount: pension,
            createdAt: new Date(),
          },
          {
            id: crypto.randomUUID(),
            payrollItemId: itemId,
            type: "deduction",
            category: "tax",
            name: "Impuesto",
            amount: tax,
            createdAt: new Date(),
          },
        );
      } catch {
        errors.push(`No se pudo generar item para ${config.membershipId}`);
      }

      setProgress(((i + 1) / Math.max(configs.length, 1)) * 100);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }

    if (generatedItems.length > 0) {
      onPayrollGenerated({
        run,
        items: generatedItems,
        lineItems: generatedLineItems,
      });
    }

    setResult({
      success: errors.length === 0,
      generatedItems: generatedItems.length,
      errors,
    });
    setIsGenerating(false);
  };

  return (
    <div>
      <div className="mb-4">
        <span className="flex text-2xl items-center gap-2">
          Generar planilla
        </span>
        <span className="text-xs text-slate-400">
          Crea un payroll run y sus items segun configuracion salarial y
          politica.
        </span>
      </div>
      <div className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mes</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {months.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Anio</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Anio" />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Sucursal</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger className="w-[220px]">
                <SelectValue placeholder="Sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.value} value={b.value}>
                    {b.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="ml-auto"
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isGenerating ? "animate-spin" : ""}`}
            />
            {isGenerating ? "Generando..." : "Generar planilla"}
          </Button>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generando...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {result && (
          <Alert variant={result.success ? "default" : "destructive"}>
            {result.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {result.success
                ? "Generacion completada"
                : "Generacion con errores"}
            </AlertTitle>
            <AlertDescription>
              <p>Items generados: {result.generatedItems}</p>
              {result.errors.length > 0 && (
                <ul className="list-disc pl-4">
                  {result.errors.map((error) => (
                    <li key={error}>{error}</li>
                  ))}
                </ul>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="rounded-lg bg-muted/50 p-4 text-sm">
          <p className="font-medium">Resumen</p>
          <p className="text-muted-foreground">
            Configuraciones disponibles: {configs.length}. La generacion calcula
            ingreso base, horas extra, descuentos y neto por item.
          </p>
        </div>
      </div>
    </div>
  );
}
