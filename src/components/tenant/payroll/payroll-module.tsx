"use client";

import { useEffect, useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  ListViewIcon,
  Refresh04Icon,
  ScrollIcon,
  Settings02Icon,
} from "@hugeicons/core-free-icons";

import { PayrollPolicyView } from "./payroll-policy-view";
import { PayrollConfigView } from "./payroll-config-view";
import { PayrollGenerationView } from "./payroll-geration-view";
import { PayrollListView } from "./payroll-list-view";

import { PAYROLL_POLICIES_MOCK } from "@/src/mocks/mock.payrollPolicy";
import { PAYROLL_CONFIGS_MOCK } from "@/src/mocks/mock.payrollConfig";
import { PAYROLL_RUNS_MOCK } from "@/src/mocks/mock.payrollRun";
import { PAYROLL_ITEMS_MOCK } from "@/src/mocks/mock.payrollItem";
import { PAYROLL_LINE_ITEMS_MOCK } from "@/src/mocks/mock.payrollLineItem";
import type { PayrollPolicy } from "@/src/types/payroll/type.payrollPolicies";
import type { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";
import type { PayrollRun } from "@/src/types/payroll/type.payrollRun";
import type { PayrollItem } from "@/src/types/payroll/type.payrollItem";
import type { PayrollLineItem } from "@/src/types/payroll/type.payrollLineItem";
import type { GeneratedPayrollBatchDTO } from "@/src/application/interfaces/payroll/PayrollPresentation";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useScrollableTabs } from "./util/handleTabChange";

export function PayrollModule() {
  const [activeTab, setActiveTab] = useState("policy");
  const [configs, setConfigs] = useState<PayrollConfig[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [lineItems, setLineItems] = useState<PayrollLineItem[]>([]);
  const [policy, setPolicy] = useState<PayrollPolicy>(PAYROLL_POLICIES_MOCK[0]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setConfigs(PAYROLL_CONFIGS_MOCK);
      setRuns(PAYROLL_RUNS_MOCK);
      setPayrolls(PAYROLL_ITEMS_MOCK);
      setLineItems(PAYROLL_LINE_ITEMS_MOCK);
      setPolicy(PAYROLL_POLICIES_MOCK[0]);
      setIsLoading(false);
    }, 350);

    return () => clearTimeout(timer);
  }, []);

  const handleGenerated = (batch: GeneratedPayrollBatchDTO) => {
    setRuns((prev) => [...prev, batch.run]);
    setPayrolls((prev) => [...prev, ...batch.items]);
    setLineItems((prev) => [...prev, ...batch.lineItems]);
    setActiveTab("list");
  };

  const { tabRefs, scrollToTab } = useScrollableTabs();

  const handleTabChange = (value: string) => {
    if (isMobile) {
      scrollToTab(value as keyof typeof tabRefs);
      setActiveTab(value);
    } else {
      setActiveTab(value);
    }
  };

  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex h-64 items-center justify-center">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            <p className="text-muted-foreground">
              Cargando modulo de payroll...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto space-y-6 lg:py-6 md:py-6">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="space-y-4"
      >
        <div className={cn("w-full", isMobile && "overflow-x-auto")}>
          <TabsList
            className={cn(
              isMobile
                ? "w-max min-w-full gap-2 sm:grid sm:w-full sm:grid-cols-3 bg-transparent"
                : "flex",
            )}
          >
            <TabsTrigger
              ref={tabRefs.policy}
              value="policy"
              className={cn(
                isMobile
                  ? "flex items-center gap-2 bg-card whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2",
              )}
            >
              <HugeiconsIcon icon={ScrollIcon} />
              Politicas
            </TabsTrigger>
            <TabsTrigger
              ref={tabRefs.config}
              value="config"
              className={cn(
                isMobile
                  ? "flex items-center gap-2 bg-card whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2",
              )}
            >
              <HugeiconsIcon icon={Settings02Icon} />
              Configuracion
            </TabsTrigger>
            <TabsTrigger
              ref={tabRefs.generate}
              value="generate"
              className={cn(
                isMobile
                  ? "flex items-center gap-2 bg-card whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2",
              )}
            >
              <HugeiconsIcon icon={Refresh04Icon} />
              Generar
            </TabsTrigger>
            <TabsTrigger
            ref={tabRefs.list}
              value="list"
              className={cn(
                isMobile
                  ? "flex items-center gap-2 bg-card whitespace-nowrap border-2 rounded-2xl"
                  : "flex items-center gap-2",
              )}
            >
              <HugeiconsIcon icon={ListViewIcon} />
              Planillas
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="policy" className="space-y-4">
          <PayrollPolicyView policy={policy} onPolicyChange={setPolicy} />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <PayrollConfigView configs={configs} onConfigsChange={setConfigs} />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <PayrollGenerationView
            configs={configs}
            policy={policy}
            onPayrollGenerated={handleGenerated}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <PayrollListView
            payrolls={payrolls}
            runs={runs}
            lineItems={lineItems}
            onPayrollsChange={setPayrolls}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
