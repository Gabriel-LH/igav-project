// components/payroll/PayrollGenerationView.tsx
'use client';

import { useState } from 'react';
import { CalendarIcon, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/separator';
import type { Employee, PayrollConfig, Payroll } from '@/src/application/interfaces/payroll/payroll';

interface PayrollGenerationViewProps {
  employees: Employee[];
  configs: PayrollConfig[];
  onPayrollGenerated: (payrolls: Payroll[]) => void;
}

// Mock de asistencias para el ejemplo
const MOCK_ATTENDANCE = {
  '1': { daysWorked: 22, regularHours: 176, overtimeHours: 5, lateMinutes: 45 },
  '2': { daysWorked: 22, regularHours: 176, overtimeHours: 0, lateMinutes: 0 },
  '3': { daysWorked: 21, regularHours: 168, overtimeHours: 6, lateMinutes: 15 },
  '4': { daysWorked: 22, regularHours: 176, overtimeHours: 2, lateMinutes: 30 },
};

export function PayrollGenerationView({ 
  employees, 
  configs, 
  onPayrollGenerated 
}: PayrollGenerationViewProps) {
  const [month, setMonth] = useState<string>((new Date().getMonth() + 1).toString());
  const [year, setYear] = useState<string>(new Date().getFullYear().toString());
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [generationResult, setGenerationResult] = useState<{
    success: boolean;
    count: number;
    errors: string[];
  } | null>(null);

  const months = [
    { value: '1', label: 'Enero' },
    { value: '2', label: 'Febrero' },
    { value: '3', label: 'Marzo' },
    { value: '4', label: 'Abril' },
    { value: '5', label: 'Mayo' },
    { value: '6', label: 'Junio' },
    { value: '7', label: 'Julio' },
    { value: '8', label: 'Agosto' },
    { value: '9', label: 'Septiembre' },
    { value: '10', label: 'Octubre' },
    { value: '11', label: 'Noviembre' },
    { value: '12', label: 'Diciembre' },
  ];

  const years = ['2023', '2024', '2025'];

  const calculatePayroll = (employee: Employee, config: PayrollConfig) => {
    const attendance = MOCK_ATTENDANCE[employee.id as keyof typeof MOCK_ATTENDANCE] || {
      daysWorked: 0,
      regularHours: 0,
      overtimeHours: 0,
      lateMinutes: 0,
    };

    let baseAmount = 0;
    let overtimeAmount = 0;

    if (config.type === 'mensual') {
      baseAmount = config.baseSalary;
      // Descuento por minutos de tardanza (ejemplo simplificado)
      const lateDeduction = (attendance.lateMinutes / 60) * (config.baseSalary / 160); // 160 horas mensuales aprox
      baseAmount -= lateDeduction;
      
      overtimeAmount = attendance.overtimeHours * (config.baseSalary / 160) * config.overtimeRate;
    } else {
      baseAmount = attendance.regularHours * (config.hourlyRate || 0);
      overtimeAmount = attendance.overtimeHours * (config.hourlyRate || 0) * config.overtimeRate;
    }

    // Calcular descuentos
    const deductions = {
      healthInsurance: config.automaticDeductions.healthInsurance ? baseAmount * 0.05 : 0,
      pension: config.automaticDeductions.pension ? baseAmount * 0.10 : 0,
      taxes: config.automaticDeductions.taxes ? baseAmount * 0.075 : 0,
      others: config.automaticDeductions.otherDeductions || 0,
      total: 0,
    };
    deductions.total = Object.values(deductions).reduce((a, b) => a + b, 0);

    const total = baseAmount + overtimeAmount - deductions.total;

    return {
      baseAmount,
      overtimeAmount,
      deductions,
      total,
      summary: attendance,
    };
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setProgress(0);
    setGenerationResult(null);

    // Simular proceso de generación
    const activeConfigs = configs.filter(c => c.status === 'active');
    const errors: string[] = [];
    const newPayrolls: Payroll[] = [];

    for (let i = 0; i < activeConfigs.length; i++) {
      const config = activeConfigs[i];
      const employee = employees.find(e => e.id === config.employeeId);

      if (!employee) {
        errors.push(`Empleado no encontrado para configuración ${config.id}`);
        continue;
      }

      try {
        const calculations = calculatePayroll(employee, config);

        const payroll: Payroll = {
          id: crypto.randomUUID(),
          employeeId: employee.id,
          employeeName: employee.name,
          period: {
            month: parseInt(month),
            year: parseInt(year),
          },
          config,
          calculations,
          summary: calculations.summary,
          status: 'draft',
          generatedAt: new Date(),
        };

        newPayrolls.push(payroll);
      } catch (error) {
        errors.push(`Error calculando nómina para ${employee.name}`);
      }

      setProgress(((i + 1) / activeConfigs.length) * 100);
      // Pequeño delay para ver el progreso
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    setGenerationResult({
      success: errors.length === 0,
      count: newPayrolls.length,
      errors,
    });

    if (newPayrolls.length > 0) {
      onPayrollGenerated(newPayrolls);
    }

    setIsGenerating(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarIcon className="h-5 w-5" />
          Generar Planilla Mensual
        </CardTitle>
        <CardDescription>
          Selecciona el período y genera las planillas basadas en asistencias
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex gap-4 items-end">
          <div className="space-y-2">
            <label className="text-sm font-medium">Mes</label>
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Seleccionar mes" />
              </SelectTrigger>
              <SelectContent>
                {months.map(m => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Año</label>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Año" />
              </SelectTrigger>
              <SelectContent>
                {years.map(y => (
                  <SelectItem key={y} value={y}>
                    {y}
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
            <RefreshCw className={`mr-2 h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
            {isGenerating ? 'Generando...' : 'Generar planilla'}
          </Button>
        </div>

        {isGenerating && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Generando planillas...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}

        {generationResult && (
          <Alert variant={generationResult.success ? 'default' : 'destructive'}>
            {generationResult.success ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <AlertCircle className="h-4 w-4" />
            )}
            <AlertTitle>
              {generationResult.success ? 'Generación completada' : 'Errores en la generación'}
            </AlertTitle>
            <AlertDescription>
              {generationResult.success ? (
                <p>Se generaron {generationResult.count} planillas correctamente.</p>
              ) : (
                <div className="space-y-2">
                  <p>Se generaron {generationResult.count} planillas con {generationResult.errors.length} errores:</p>
                  <ul className="list-disc pl-4">
                    {generationResult.errors.map((error, i) => (
                      <li key={i} className="text-sm">{error}</li>
                    ))}
                  </ul>
                </div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Separator />

        <div className="bg-muted/50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Resumen del proceso</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Empleados activos</p>
              <p className="text-2xl font-bold">{configs.filter(c => c.status === 'active').length}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Configuraciones</p>
              <p className="text-2xl font-bold">{configs.length}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            El sistema calculará automáticamente horas trabajadas, horas extra y descuentos basados en las asistencias del período.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}