// components/subscription/modals/cancel-subscription-modal.tsx
"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface CancelSubscriptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  planName: string;
}

export function CancelSubscriptionModal({
  open,
  onOpenChange,
  onConfirm,
  planName,
}: CancelSubscriptionModalProps) {
  const [reason, setReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [step, setStep] = useState<"reason" | "confirm">("reason");

  const reasons = [
    { value: "too_expensive", label: "Muy caro" },
    { value: "missing_features", label: "Faltan características" },
    { value: "not_using", label: "No lo estoy usando" },
    { value: "switching", label: "Cambiando a otro proveedor" },
    { value: "other", label: "Otro motivo" },
  ];

  const handleContinue = () => {
    if (reason === "other" && !otherReason.trim()) return;
    setStep("confirm");
  };

  const handleConfirm = () => {
    const finalReason = reason === "other" ? otherReason : reasons.find(r => r.value === reason)?.label || reason;
    onConfirm(finalReason);
    // Reset
    setReason("");
    setOtherReason("");
    setStep("reason");
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset después de cerrar
    setTimeout(() => {
      setReason("");
      setOtherReason("");
      setStep("reason");
    }, 300);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Cancelar suscripción
          </DialogTitle>
          <DialogDescription>
            {step === "reason" 
              ? "Lamentamos que te vayas. Cuéntanos por qué cancelas tu plan."
              : "¿Estás seguro de que deseas cancelar tu suscripción?"}
          </DialogDescription>
        </DialogHeader>

        {step === "reason" ? (
          <div className="space-y-4 py-4">
            <RadioGroup value={reason} onValueChange={setReason} className="space-y-3">
              {reasons.map((r) => (
                <div key={r.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={r.value} id={r.value} />
                  <Label htmlFor={r.value}>{r.label}</Label>
                </div>
              ))}
            </RadioGroup>

            {reason === "other" && (
              <Textarea
                placeholder="Especifica el motivo..."
                value={otherReason}
                onChange={(e) => setOtherReason(e.target.value)}
                className="mt-2"
              />
            )}

            <Alert variant="default" className="border-amber-500 bg-amber-50">
              <AlertDescription className="text-amber-800">
                Al cancelar perderás acceso a todas las funcionalidades del plan {planName} al final del período actual.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-center text-lg">
              Vas a cancelar el plan <span className="font-bold">{planName}</span>
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Esta acción no se puede deshacer. Perderás acceso a todas las funcionalidades premium.
            </p>

            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                Todos los datos de tu cuenta se conservarán, pero las funcionalidades del plan quedarán restringidas.
              </AlertDescription>
            </Alert>
          </div>
        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            {step === "reason" ? "Volver" : "No, mantener plan"}
          </Button>
          {step === "reason" ? (
            <Button 
              onClick={handleContinue}
              disabled={!reason || (reason === "other" && !otherReason.trim())}
            >
              Continuar
            </Button>
          ) : (
            <Button variant="destructive" onClick={handleConfirm}>
              Sí, cancelar suscripción
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}