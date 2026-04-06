import {
  CustomModal,
  CustomModalFooter,
  CustomModalHeader,
  CustomModalTitle,
} from "../custom/CustomModal";
import { CustomSelect } from "../custom/CustomSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import type { Branch } from "@/src/types/branch/type.branch";
import type { User } from "@/src/types/user/type.user";
import type { TenantConfig } from "@/src/types/tenant/type.tenantConfig";
import { toast } from "sonner";

interface OpenSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: (input: {
    branchId: string;
    openingAmount: number;
    notes?: string;
  }) => Promise<boolean>;
  branches: Branch[];
  cashiers: User[];
  tenantConfig: TenantConfig | null;
}

export function OpenSessionModal({
  open,
  onOpenChange,
  onSessionCreated,
  branches,
  tenantConfig,
}: OpenSessionModalProps) {
  const [branchId, setBranchId] = useState("");
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const handleSubmit = async () => {
    if (tenantConfig?.cash.openingCashRequired && (openingAmount === null || openingAmount === undefined || openingAmount < 0)) {
      toast.error("El monto inicial es obligatorio por configuración de caja.");
      return;
    }

    const wasCreated = await onSessionCreated({
      branchId,
      openingAmount: openingAmount || 0,
      notes: notes || undefined,
    });
    if (!wasCreated) return;
    onOpenChange(false);
    setBranchId("");
    setOpeningAmount(0);
    setNotes("");
  };

  const branchOptions = branches.map((branch) => ({
    label: branch.name,
    value: branch.id,
  }));

  return (
    <CustomModal open={open} onOpenChange={onOpenChange}>
      <CustomModalHeader>
        <CustomModalTitle>Abrir nueva sesion de caja</CustomModalTitle>
      </CustomModalHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Sucursal</label>
          <CustomSelect
            value={branchId}
            onValueChange={setBranchId}
            options={branchOptions}
            placeholder="Seleccionar sucursal"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1">
            Monto inicial
            {tenantConfig?.cash.openingCashRequired && (
              <span className="text-destructive">*</span>
            )}
          </label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={openingAmount}
            onChange={(e) => setOpeningAmount(parseFloat(e.target.value) || 0)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Notas (opcional)</label>
          <Input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observaciones iniciales"
          />
        </div>
      </div>

      <CustomModalFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancelar
        </Button>
        <Button onClick={handleSubmit} disabled={!branchId}>
          Abrir caja
        </Button>
      </CustomModalFooter>
    </CustomModal>
  );
}
