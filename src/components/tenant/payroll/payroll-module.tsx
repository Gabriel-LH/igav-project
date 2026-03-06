// components/payroll/PayrollModule.tsx
"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PayrollConfigView } from "./payroll-config-view";
import { PayrollGenerationView } from "./payroll-geration-view";
import { PayrollListView } from "./payroll-list-view";
import { PayrollPolicyView } from "./payroll-policy-view";
import type {
  PayrollConfigView,
  PayrollView,
} from "@/src/types/payroll/type.payrollView";
import { PayrollPolicy } from "@/src/types/payroll/type.payrollPolicies";
import {
  PAYROLL_CONFIGS_VIEW_MOCK,
  PAYROLL_EMPLOYEES_MOCK,
  PAYROLLS_VIEW_MOCK,
} from "@/src/mocks/mock.payroll";
import { PAYROLL_POLICIES_MOCK } from "@/src/mocks/mock.payrollPolicy";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ListViewIcon,
  Refresh04Icon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

export function PayrollModule() {
  const [activeTab, setActiveTab] = useState("policy");
  const [configs, setConfigs] = useState<PayrollConfigView[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollView[]>([]);
  const [policy, setPolicy] = useState<PayrollPolicy>(PAYROLL_POLICIES_MOCK[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simular carga de datos
    setTimeout(() => {
      setConfigs(PAYROLL_CONFIGS_VIEW_MOCK);
      setPayrolls(PAYROLLS_VIEW_MOCK);
      setPolicy(PAYROLL_POLICIES_MOCK[0]);
      setIsLoading(false);
    }, 500);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">
              Cargando módulo de salarios...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full max-w-2xl grid-cols-4">
          <TabsTrigger value="policy" className="flex items-center gap-2">
            <HugeiconsIcon icon={Settings02Icon} />
            Políticas
          </TabsTrigger>
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

        <TabsContent value="policy" className="space-y-4">
          <PayrollPolicyView policy={policy} onPolicyChange={setPolicy} />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <PayrollConfigView
            configs={configs}
            employees={PAYROLL_EMPLOYEES_MOCK}
            onConfigsChange={setConfigs}
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <PayrollGenerationView
            employees={PAYROLL_EMPLOYEES_MOCK}
            configs={configs}
            policy={policy}
            onPayrollGenerated={(newPayrolls) => {
              setPayrolls([...payrolls, ...newPayrolls]);
            }}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <PayrollListView payrolls={payrolls} onPayrollsChange={setPayrolls} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
