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
import { PayrollGenerationView } from "./payroll-generation-view";
import { PayrollListView } from "./payroll-list-view";

import { 
  getPayrollDataAction, 
  getPayrollMembersAction,
  savePayrollPolicyAction,
  generatePayrollRunAction,
  savePayrollConfigAction,
  updatePayrollConfigAction
} from "@/src/app/(tenant)/tenant/actions/payroll.actions";
import { getBranchesAction } from "@/src/app/(tenant)/tenant/actions/branch.actions";

import { 
  CreatePayrollConfigDTO,
  UpdatePayrollConfigDTO 
} from "@/src/domain/tenant/repositories/PayrollRepository";

import type { PayrollPolicy } from "@/src/types/payroll/type.payrollPolicies";
import type { PayrollConfig } from "@/src/types/payroll/type.payrollConfig";
import type { PayrollRun } from "@/src/types/payroll/type.payrollRun";
import type { PayrollItem } from "@/src/types/payroll/type.payrollItem";
import type { PayrollLineItem } from "@/src/types/payroll/type.payrollLineItem";
import type { GeneratedPayrollBatchDTO } from "@/src/application/interfaces/payroll/PayrollPresentation";
import { toast } from "sonner";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useScrollableTabs } from "./util/handleTabChange";

export function PayrollModule() {
  const [activeTab, setActiveTab] = useState("policy");
  const [configs, setConfigs] = useState<PayrollConfig[]>([]);
  const [runs, setRuns] = useState<PayrollRun[]>([]);
  const [payrolls, setPayrolls] = useState<PayrollItem[]>([]);
  const [lineItems, setLineItems] = useState<PayrollLineItem[]>([]);
  const [members, setMembers] = useState<{ membershipId: string; userId: string; displayName: string; email?: string }[]>([]);
  const [branches, setBranches] = useState<{ id: string; name: string }[]>([]);
  const [policy, setPolicy] = useState<PayrollPolicy>({
    id: "default-policy",
    tenantId: "current-tenant",
    name: "Política General",
    overtimeMultiplier: 1.5,
    deductions: {
      healthInsurancePercent: 0,
      pensionPercent: 0,
      taxPercent: 0,
    },
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [payrollData, payrollMembers, branchesRes] = await Promise.all([
          getPayrollDataAction() as Promise<{
            policy: PayrollPolicy;
            configs: PayrollConfig[];
            runs: PayrollRun[];
            payrolls: PayrollItem[];
            lineItems: PayrollLineItem[];
          }>,
          getPayrollMembersAction(),
          getBranchesAction(),
        ]);

        if (payrollData.policy) setPolicy(payrollData.policy);
        setConfigs(payrollData.configs as unknown as PayrollConfig[]);
        setRuns(payrollData.runs as unknown as PayrollRun[]);
        setPayrolls(payrollData.payrolls as unknown as PayrollItem[]);
        setLineItems(payrollData.lineItems as unknown as PayrollLineItem[]);
        setMembers(payrollMembers);
        setBranches(
          branchesRes.success
            ? (branchesRes.data ?? []).map((branch: any) => ({
                id: branch.id,
                name: branch.name,
              }))
            : [],
        );
      } catch (error) {
        console.error("Error loading payroll data:", error);
        toast.error("Error al cargar datos de nómina");
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  const handlePolicySave = async (updatedPolicy: PayrollPolicy) => {
    try {
      await savePayrollPolicyAction({
        healthInsurancePercent: updatedPolicy.deductions.healthInsurancePercent,
        pensionPercent: updatedPolicy.deductions.pensionPercent,
        taxPercent: updatedPolicy.deductions.taxPercent,
        overtimeMultiplier: updatedPolicy.overtimeMultiplier,
      });
      setPolicy(updatedPolicy);
      toast.success("Política guardada");
    } catch {
      toast.error("Error al guardar política");
    }
  };

  const handleConfigSave = async (config: Omit<PayrollConfig, "id" | "tenantId"> & { id?: string }) => {
    try {
      if (config.id) {
        const result = await updatePayrollConfigAction(config.id, config as unknown as UpdatePayrollConfigDTO);
        setConfigs((prev) =>
          prev.map((c) => (c.id === config.id ? (result as unknown as PayrollConfig) : c))
        );
      } else {
        const result = await savePayrollConfigAction(config as unknown as CreatePayrollConfigDTO);
        setConfigs((prev) => [...prev, result as unknown as PayrollConfig]);
      }
      toast.success("Configuración guardada");
    } catch {
      toast.error("Error al guardar configuración");
    }
  };

  const handlePayrollGenerated = async (batch: GeneratedPayrollBatchDTO) => {
    try {
      await generatePayrollRunAction(batch);
      const payrollData = await getPayrollDataAction();
      if (payrollData.policy) setPolicy(payrollData.policy as PayrollPolicy);
      setConfigs(payrollData.configs as unknown as PayrollConfig[]);
      setRuns(payrollData.runs as unknown as PayrollRun[]);
      setPayrolls(payrollData.payrolls as unknown as PayrollItem[]);
      setLineItems(payrollData.lineItems as unknown as PayrollLineItem[]);
      setActiveTab("list");
      toast.success("Planilla generada y guardada");
    } catch {
      toast.error("Error al guardar planilla");
    }
  };

  const handlePayrollDeleted = ({
    deletedItemId,
    deletedRunId,
  }: {
    deletedItemId: string;
    deletedRunId: string | null;
  }) => {
    setPayrolls((prev) => prev.filter((item) => item.id !== deletedItemId));
    setLineItems((prev) =>
      prev.filter((lineItem) => lineItem.payrollItemId !== deletedItemId),
    );

    if (deletedRunId) {
      setRuns((prev) => prev.filter((run) => run.id !== deletedRunId));
    }
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
          <PayrollPolicyView policy={policy} onPolicyChange={handlePolicySave} />
        </TabsContent>

        <TabsContent value="config" className="space-y-4">
          <PayrollConfigView 
            configs={configs} 
            members={members}
            onConfigSave={handleConfigSave} 
          />
        </TabsContent>

        <TabsContent value="generate" className="space-y-4">
          <PayrollGenerationView
            configs={configs}
            branches={branches}
            policy={policy}
            onPayrollGenerated={handlePayrollGenerated}
          />
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <PayrollListView
            payrolls={payrolls}
            runs={runs}
            lineItems={lineItems}
            members={members}
            onPayrollDeleted={handlePayrollDeleted}
            onPayrollsChange={setPayrolls}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
