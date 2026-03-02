import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

export function BarcodeScanner({ onScan }: { onScan: (code: string) => void }) {
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState("");

  const simulateScan = () => {
    setScanning(true);
    setTimeout(() => {
      const randomCode = Math.floor(Math.random() * 1000000000000)
        .toString()
        .padStart(13, "0");
      onScan(randomCode);
      setScanning(false);
    }, 1500);
  };

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "w-full h-40 border-2 border-dashed rounded-lg flex items-center justify-center cursor-pointer transition-colors",
          scanning
            ? "border-green-500 bg-green-50 animate-pulse"
            : "border-muted hover:border-primary",
        )}
        onClick={!scanning ? simulateScan : undefined}
      >
        {scanning ? (
          <div className="text-center">
            <ScanLine className="w-10 h-10 text-green-500 mx-auto mb-2 animate-bounce" />
            <p className="text-sm text-green-600 font-medium">Escaneando...</p>
          </div>
        ) : (
          <div className="text-center text-muted-foreground">
            <ScanLine className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm">Haz clic para simular escaneo</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">O ingresa manualmente:</p>
        <div className="flex gap-2">
          <Input
            placeholder="1234567890123"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            maxLength={13}
            className="font-mono text-sm"
          />
          <Button
            size="sm"
            onClick={() => manualCode && onScan(manualCode)}
            disabled={manualCode.length < 8}
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
