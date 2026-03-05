// components/payroll/PayrollModule.tsx
'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PayrollConfigView } from './payroll-config-view';
import { PayrollGenerationView } from './payroll-geration-view';
import { PayrollListView } from './payroll-list-view';
import type { PayrollConfig, Payroll, Employee } from '@/src/application/interfaces/payroll/payroll';
import { HugeiconsIcon } from '@hugeicons/react';
import { ListViewIcon, Refresh04Icon, Settings02Icon } from '@hugeicons/core-free-icons';

// Datos mock
const MOCK_EMPLOYEES: Employee[] = [
  { id: '1', name: 'Juan Pérez', email: 'juan@empresa.com', membership: 'EMP001', department: 'Ventas', hireDate: new Date('2023-01-15') },
  { id: '2', name: 'María García', email: 'maria@empresa.com', membership: 'EMP002', department: 'Marketing', hireDate: new Date('2023-02-20') },
  { id: '3', name: 'Carlos López', email: 'carlos@empresa.com', membership: 'EMP003', department: 'IT', hireDate: new Date('2023-03-10') },
  { id: '4', name: 'Ana Martínez', email: 'ana@empresa.com', membership: 'EMP004', department: 'RRHH', hireDate: new Date('2023-04-05') },
];

const MOCK_CONFIGS: PayrollConfig[] = [
  {
    id: 'c1',
    employeeId: '1',
    employeeName: 'Juan Pérez',
    type: 'mensual',
    baseSalary: 2500,
    overtimeRate: 1.5,
    automaticDeductions: {
      healthInsurance: true,
      pension: true,
      taxes: true,
      otherDeductions: 0,
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'c2',
    employeeId: '2',
    employeeName: 'María García',
    type: 'mensual',
    baseSalary: 2800,
    overtimeRate: 1.5,
    automaticDeductions: {
      healthInsurance: true,
      pension: true,
      taxes: true,
      otherDeductions: 50,
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'c3',
    employeeId: '3',
    employeeName: 'Carlos López',
    type: 'por_hora',
    baseSalary: 0,
    hourlyRate: 18.5,
    overtimeRate: 2.0,
    automaticDeductions: {
      healthInsurance: true,
      pension: true,
      taxes: true,
      otherDeductions: 0,
    },
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

const MOCK_PAYROLLS: Payroll[] = [
  {
    id: 'p1',
    employeeId: '1',
    employeeName: 'Juan Pérez',
    period: { month: 2, year: 2024 },
    config: MOCK_CONFIGS[0],
    calculations: {
      baseAmount: 2500,
      overtimeAmount: 187.50,
      deductions: {
        healthInsurance: 125,
        pension: 250,
        taxes: 187.50,
        others: 0,
        total: 562.50,
      },
      total: 2125,
    },
    summary: {
      daysWorked: 22,
      regularHours: 176,
      overtimeHours: 5,
      lateMinutes: 45,
    },
    status: 'paid',
    generatedAt: new Date('2024-02-28'),
    paidAt: new Date('2024-03-05'),
  },
  {
    id: 'p2',
    employeeId: '2',
    employeeName: 'María García',
    period: { month: 2, year: 2024 },
    config: MOCK_CONFIGS[1],
    calculations: {
      baseAmount: 2800,
      overtimeAmount: 0,
      deductions: {
        healthInsurance: 140,
        pension: 280,
        taxes: 210,
        others: 50,
        total: 680,
      },
      total: 2120,
    },
    summary: {
      daysWorked: 22,
      regularHours: 176,
      overtimeHours: 0,
      lateMinutes: 0,
    },
    status: 'calculated',
    generatedAt: new Date('2024-02-28'),
  },
  {
    id: 'p3',
    employeeId: '3',
    employeeName: 'Carlos López',
    period: { month: 2, year: 2024 },
    config: MOCK_CONFIGS[2],
    calculations: {
      baseAmount: 3256, // 176 horas * 18.5
      overtimeAmount: 222, // 6 horas extra * 18.5 * 2
      deductions: {
        healthInsurance: 162.80,
        pension: 325.60,
        taxes: 244.20,
        others: 0,
        total: 732.60,
      },
      total: 2745.40,
    },
    summary: {
      daysWorked: 22,
      regularHours: 176,
      overtimeHours: 6,
      lateMinutes: 15,
    },
    status: 'draft',
    generatedAt: new Date('2024-02-28'),
  },
];

export function PayrollModule() {
  const [activeTab, setActiveTab] = useState('config');
  const [configs, setConfigs] = useState<PayrollConfig[]>([]);
  const [payrolls, setPayrolls] = useState<Payroll[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setConfigs(MOCK_CONFIGS);
      setPayrolls(MOCK_PAYROLLS);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Cargando módulo de salarios...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="config" className="flex items-center gap-2">
            <HugeiconsIcon icon={Settings02Icon} />
            Configuración
          </TabsTrigger>
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <HugeiconsIcon icon={Refresh04Icon} />
            Generar
          </TabsTrigger>
          <TabsTrigger value="list" className="flex items-center gap-2">
            <HugeiconsIcon icon={ListViewIcon} />
            Planillas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config" className="space-y-4">
          <PayrollConfigView 
            configs={configs}
            employees={MOCK_EMPLOYEES}
            onConfigsChange={setConfigs}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <PayrollGenerationView 
            employees={MOCK_EMPLOYEES}
            configs={configs}
            onPayrollGenerated={(newPayrolls) => {
              setPayrolls([...payrolls, ...newPayrolls]);
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <PayrollListView 
            payrolls={payrolls}
            onPayrollsChange={setPayrolls}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}