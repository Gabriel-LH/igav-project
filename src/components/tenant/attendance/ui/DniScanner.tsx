import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface DniScannerProps {
  onScan: (dni: string) => void;
  employees: any[];
}

export function DniScanner({
  onScan,
  employees,
}: DniScannerProps) {
  const [scanning, setScanning] = useState(false);
  const [manualDni, setManualDni] = useState("");

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const randomDni =
        employees[Math.floor(Math.random() * employees.length)]?.dni || "";
      onScan(randomDni);
      setScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "w-full h-48 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors",
          scanning
            ? "border-green-500 bg-green-50 animate-pulse"
            : "border-muted hover:border-primary",
        )}
        onClick={!scanning ? simulateScan : undefined}
      >
        {scanning ? (
          <div className="text-center">
            <ScanLine className="w-12 h-12 text-green-500 mx-auto mb-2 animate-bounce" />
            <p className="text-sm text-green-600 font-medium">
              Escaneando DNI...
            </p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <ScanLine className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Haz clic para escanear DNI</p>
            <p className="text-xs mt-1">o ingresa manualmente</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Ingreso manual:</Label>
        <div className="flex gap-2">
          <Input
            placeholder="Número de DNI"
            value={manualDni}
            onChange={(e) => setManualDni(e.target.value)}
            className="font-mono"
            maxLength={8}
          />
          <Button
            onClick={() => manualDni && onScan(manualDni)}
            disabled={manualDni.length < 8}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}