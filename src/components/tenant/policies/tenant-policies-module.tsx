"use client";

import { useState, useEffect } from "react";
import { Save, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PolicyConfigForm } from "./policy-config-form";
import {
  getActivePolicyAction,
  upsertPolicyAction,
} from "@/src/app/(tenant)/tenant/actions/settings.actions";
import { TenantPolicy } from "@/src/types/tenant/type.tenantPolicy";
import { DEFAULT_TENANT_POLICY_SECTIONS } from "@/src/lib/tenant-defaults";
import { toast } from "sonner";
import { HugeiconsIcon } from "@hugeicons/react";
import { File02Icon } from "@hugeicons/core-free-icons";
import { PolicyHeader } from "./policy-header";

export function TenantPoliciesModule() {
  const [policy, setPolicy] = useState<TenantPolicy | null>(null);
  const [originalPolicy, setOriginalPolicy] = useState<TenantPolicy | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const res = await getActivePolicyAction();
        if (res.success && res.data) {
          setPolicy(res.data);
          setOriginalPolicy(res.data);
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
        }
      } catch (error) {
        console.error("Error loading policies:", error);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!policy || !originalPolicy) return;
    const changed = JSON.stringify(policy) !== JSON.stringify(originalPolicy);
    setHasUnsavedChanges(changed);
  }, [policy, originalPolicy]);

  const handlePolicyChange = (section: keyof TenantPolicy, values: any) => {
    if (!policy) return;
    setPolicy({
      ...policy,
      [section]: {
        ...(policy[section] as any),
        ...values,
      },
    });
  };

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
      } else {
        toast.error("Error al guardar políticas: " + res.error);
      }
    } catch (error) {
      toast.error("Error de conexión al guardar políticas");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setPolicy(originalPolicy);
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
    <div className="space-y-6">
      <PolicyHeader
        hasUnsavedChanges={hasUnsavedChanges}
        isSaving={isSaving}
        handleCancel={handleCancel}
        handleSave={handleSave}
      />
      <PolicyConfigForm policy={policy} onChange={handlePolicyChange} />
    </div>
  );
}
