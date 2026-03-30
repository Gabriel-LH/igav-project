"use client";

import { useState, useEffect } from "react";
import { useForm, FormProvider } from "react-hook-form";
import {
  getActivePolicyAction,
  upsertPolicyAction,
} from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { toast } from "sonner";
import { PolicyHeader } from "./policy-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/tabs";
import { SalesPoliciesTab } from "./sales-policy-tab";
import { InventoryPoliciesTab } from "./inventory-policy-tab";
import { FinancialPoliciesTab } from "./financials-policy-tab";
import { RentalsPoliciesTab } from "./rentals-policy-tab";
import { ReservationsPoliciesTab } from "./reservation-policy-tab";
import { SecurityPoliciesTab } from "./security-policy-tab";

export function TenantPoliciesModule() {
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [originalPolicy, setOriginalPolicy] = useState<TenantPolicy | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // 👇 Inicializa react-hook-form
  const formMethods = useForm({
    defaultValues: DEFAULT_TENANT_POLICY_SECTIONS,
  });

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getActivePolicyAction();
        if (res.success && res.data) {
          setPolicy(res.data);
          setOriginalPolicy(res.data);
          // 👇 Actualiza los valores del formulario cuando carga la data
          formMethods.reset(res.data);
        } else {
          const defPolicy: TenantPolicy = {
            id: "default",
            tenantId: "default",
            version: 1,
            isActive: true,
            createdAt: new Date(),
            updatedBy: "system",
            ...DEFAULT_TENANT_POLICY_SECTIONS,
          };
          setPolicy(defPolicy);
          setOriginalPolicy(defPolicy);
          // 👇 Reset con valores por defecto
          formMethods.reset(defPolicy);
        }
      } catch (err) {
        console.error("Error loading policies:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, [formMethods]);

  // 👇 Escucha cambios del formulario para actualizar el estado
  useEffect(() => {
    const subscription = formMethods.watch((values) => {
      if (policy) {
        setPolicy((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            ...values,
          } as TenantPolicy;
        });
      }
    });
    return () => subscription.unsubscribe();
  }, [formMethods, policy]);



  useEffect(() => {
    if (!policy || !originalPolicy) return;
    const changed = JSON.stringify(policy) !== JSON.stringify(originalPolicy);
    setHasUnsavedChanges(changed);
  }, [policy, originalPolicy]);

  const handleSave = async () => {
    if (!policy) return;
    setIsSaving(true);
    try {
      const res = await upsertPolicyAction(
        policy,
        "Actualización manual de políticas",
      );
      if (res.success) {
        toast.success("Políticas actualizadas correctamente");
        setOriginalPolicy(policy);
        setHasUnsavedChanges(false);
        // 👇 Confirma los cambios en el formulario
        formMethods.reset(policy);
      } else {
        toast.error("Error al guardar políticas: " + res.error);
      }
    } catch (err) {
      console.error("Error saving policies:", err);
      toast.error("Error de conexión al guardar políticas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPolicy(originalPolicy);
    // 👇 Restaura los valores originales en el formulario
    if (originalPolicy) {
      formMethods.reset(originalPolicy);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-b-violet-600 border-t-violet-300 mx-auto mb-4"></div>
        <div className="text-center animate-pulse text-muted-foreground">
          Cargando políticas del sistema...
        </div>
      </div>
    );
  }

  if (!policy) return null;

  return (
    // 👇 Envuelve TODO con FormProvider
    <FormProvider {...formMethods}>
      <div className="space-y-6">
        <PolicyHeader
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          handleCancel={handleCancel}
          handleSave={handleSave}
        />

        <Tabs defaultValue="sales">
          <TabsList>
            <TabsTrigger value="sales">Ventas</TabsTrigger>
            <TabsTrigger value="rentals">Alquileres</TabsTrigger>
            <TabsTrigger value="inventory">Inventario</TabsTrigger>
            <TabsTrigger value="financials">Finanzas</TabsTrigger>
            <TabsTrigger value="reservations">Reservaciones</TabsTrigger>
            <TabsTrigger value="security">Seguridad</TabsTrigger>
          </TabsList>
          <TabsContent value="sales">
            <SalesPoliciesTab />
          </TabsContent>
          <TabsContent value="rentals">
            <RentalsPoliciesTab />
          </TabsContent>
          <TabsContent value="inventory">
            <InventoryPoliciesTab />
          </TabsContent>
          <TabsContent value="financials">
            <FinancialPoliciesTab />
          </TabsContent>
          <TabsContent value="reservations">
            <ReservationsPoliciesTab />
          </TabsContent>
          <TabsContent value="security">
            <SecurityPoliciesTab />
          </TabsContent>
        </Tabs>
      </div>
    </FormProvider>
  );
}