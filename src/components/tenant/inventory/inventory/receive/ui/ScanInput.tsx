// src/components/inventory/assignment/ScanInput.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/card";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Barcode, Camera, Loader2 } from "lucide-react";
import { Badge } from "@/components/badge";
import { BarcodeScanner } from "../../barcode/Scanner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBarcodeScanner } from "@/src/hooks/useBarcodeScanner";

interface ScanInputProps {
  onScan: (code: string) => void;
  isScanning: boolean;
  lastScannedCode?: string;
  lastScanStatus?: "success" | "error";
  disabled?: boolean;
}

export const ScanInput: React.FC<ScanInputProps> = ({
  onScan,
  isScanning,
  lastScannedCode,
  lastScanStatus,
  disabled = false,
}) => {
  const [manualCode, setManualCode] = useState("");
  const [cameraOpen, setCameraOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDisabled = disabled || isScanning;

  const handleScan = useCallback(
    (code: string) => {
      if (disabled) return;
      onScan(code);
    },
    [disabled, onScan],
  );

  useBarcodeScanner({ onScan: handleScan });

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isDisabled) return;
    if (manualCode.trim()) {
      handleScan(manualCode.trim());
      setManualCode("");
    }
  };

  // Efecto para sonido (opcional - requeriría Web Audio API)
  useEffect(() => {
    if (lastScanStatus === "success") {
      // Reproducir beep de éxito
      console.log("Beep success");
    } else if (lastScanStatus === "error") {
      // Reproducir beep de error
      console.log("Beep error");
    }
  }, [lastScanStatus]);

  return (
    <Card>
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold flex items-center gap-2">
                <Barcode className="h-4 w-4" />
                Escaneo rápido
              </p>
              <p className="text-xs text-muted-foreground">
                Usa pistola o ingresa código manualmente
              </p>
            </div>

            {lastScannedCode && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  Último: {lastScannedCode}
                </span>
                {lastScanStatus === "success" ? (
                  <Badge
                    variant="outline"
                    className="border-green-300 text-green-700"
                  >
                    ✓
                  </Badge>
                ) : lastScanStatus === "error" ? (
                  <Badge variant="destructive">✗</Badge>
                ) : null}
              </div>
            )}
          </div>

          <form onSubmit={handleManualSubmit} className="flex flex-wrap gap-2">
            <div className="relative flex-1 min-w-[240px]">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Ingresa código manualmente..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={isDisabled}
                className="pr-10"
              />
              {isScanning && !disabled && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            <Button type="submit" disabled={!manualCode.trim() || isDisabled}>
              Agregar
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCameraOpen(true)}
              disabled={isDisabled}
            >
              <Camera className="h-4 w-4 mr-2" />
              Escanear con cámara
            </Button>
          </form>

          {disabled && (
            <p className="text-xs text-muted-foreground">
              Selecciona una sucursal para habilitar la recepción.
            </p>
          )}

          <Dialog open={cameraOpen} onOpenChange={setCameraOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Escaneo por cámara</DialogTitle>
              </DialogHeader>
              <BarcodeScanner
                onScan={handleScan}
                enableHardwareScanner={false}
                autoStopOnScan
              />
            </DialogContent>
          </Dialog>
        </div>
      </CardContent>
    </Card>
  );
};
