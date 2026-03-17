// src/components/inventory/assignment/ScanInput.tsx
import React, { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/card";
import { Input } from "@/components/input";
import { Button } from "@/components/button";
import { Barcode, Search, Loader2 } from "lucide-react";
import { Badge } from "@/components/badge";
import { BarcodeScanner } from "../../barcode/Scanner";

interface ScanInputProps {
  onScan: (code: string) => void;
  isScanning: boolean;
  mode: "auto" | "manual";
  onModeChange: (mode: "auto" | "manual") => void;
  lastScannedCode?: string;
  lastScanStatus?: "success" | "error";
}

export const ScanInput: React.FC<ScanInputProps> = ({
  onScan,
  isScanning,
  mode,
  onModeChange,
  lastScannedCode,
  lastScanStatus,
}) => {
  const [manualCode, setManualCode] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (mode === "auto" && inputRef.current) {
      inputRef.current.focus();
    }
  }, [mode]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      onScan(manualCode.trim());
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
          {/* Selector de modo */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Badge
                variant={mode === "auto" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onModeChange("auto")}
              >
                <Barcode className="h-3 w-3 mr-1" />
                Modo Ráfaga
              </Badge>
              <Badge
                variant={mode === "manual" ? "default" : "outline"}
                className="cursor-pointer"
                onClick={() => onModeChange("manual")}
              >
                <Search className="h-3 w-3 mr-1" />
                Modo Manual
              </Badge>
            </div>

            {lastScannedCode && (
              <div className="flex items-center space-x-2">
                <span className="text-xs text-muted-foreground">
                  Último: {lastScannedCode}
                </span>
                {lastScanStatus === "success" ? (
                  <Badge variant="success">✓</Badge>
                ) : lastScanStatus === "error" ? (
                  <Badge variant="destructive">✗</Badge>
                ) : null}
              </div>
            )}
          </div>

          {/* Input según modo */}
          {mode === "auto" ? (
            <div className="relative">
              <Input
                ref={inputRef}
                type="text"
                placeholder="Escanea un código QR o de barras..."
                onChange={(e) => {
                  const value = e.target.value;
                  // Detectar cuando se completa un escaneo (usualmente con Enter o timeout)
                  if (value.endsWith("\n") || value.length > 20) {
                    onScan(value.replace("\n", ""));
                    e.target.value = "";
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    onScan(e.currentTarget.value);
                    e.currentTarget.value = "";
                  }
                }}
                disabled={isScanning}
                className="pr-10"
              />
              {isScanning && (
                <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
          ) : (
            <form onSubmit={handleManualSubmit} className="flex space-x-2">
              <Input
                type="text"
                placeholder="Ingresa código manualmente..."
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                disabled={isScanning}
                className="flex-1"
              />
              <Button type="submit" disabled={!manualCode.trim() || isScanning}>
                Buscar
              </Button>
            </form>
          )}

          <BarcodeScanner onScan={onScan} />
        </div>
      </CardContent>
    </Card>
  );
};
