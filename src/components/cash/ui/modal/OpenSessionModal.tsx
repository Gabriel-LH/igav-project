// components/cash/open-session-modal.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  const [openingAmount, setOpeningAmount] = useState(0);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir nueva sesión de caja</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Sucursal</label>
            <Select value={branchId} onValueChange={setBranchId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar sucursal" />
              </SelectTrigger>
              <SelectContent>
                {branches.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Monto inicial</label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={openingAmount}
              onChange={(e) => setOpeningAmount(parseFloat(e.target.value))}
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
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSubmit} disabled={!branchId}>
            Abrir caja
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
