// components/cash/open-session-modal.tsx
import {
  CustomModal,
  CustomModalHeader,
  CustomModalTitle,
  CustomModalFooter,
} from "../custom/CustomModal";
import { CustomSelect } from "../custom/CustomSelect";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { CashSession } from "@/src/types/cash/type.cash";
import type { Branch } from "@/src/types/branch/type.branch";
import type { User } from "@/src/types/user/type.user";

interface OpenSessionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSessionCreated: (session: CashSession) => void;
  branches: Branch[];
  cashiers: User[];
}

export function OpenSessionModal({
  open,
  onOpenChange,
  onSessionCreated,
  branches,
}: OpenSessionModalProps) {
  const [branchId, setBranchId] = useState("");
  const [openingAmount, setOpeningAmount] = useState<number>(0);
  const [notes, setNotes] = useState("");

  const handleSubmit = () => {
    const newSession: CashSession = {
      id: crypto.randomUUID(),
      branchId,
      openedById: "current-user", // En producción vendría del contexto
      openedAt: new Date(),
      sessionNumber: `SES-${Math.floor(Math.random() * 1000)
        .toString()
        .padStart(3, "0")}`,
      status: "open",
      openingAmount,
      notes: notes || undefined,
    };

    onSessionCreated(newSession);
    onOpenChange(false);
    // Reset
    setBranchId("");
    setOpeningAmount(0);
    setNotes("");
  };

  const branchOptions = branches.map((b) => ({ label: b.name, value: b.id }));

  return (
    <CustomModal open={open} onOpenChange={onOpenChange}>
      <CustomModalHeader>
        <CustomModalTitle>Abrir nueva sesión de caja</CustomModalTitle>
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
          <label className="text-sm font-medium">Monto inicial</label>
          <Input
            type="number"
            min="0"
            step="0.01"
            value={openingAmount || ""}
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
