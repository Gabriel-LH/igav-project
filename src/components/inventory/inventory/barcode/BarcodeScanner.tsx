import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

type SupportedFormat =
  | "qr_code"
  | "ean_13"
  | "ean_8"
  | "code_128"
  | "code_39"
  | "codabar"
  | "upc_a"
  | "upc_e";

interface BarcodeScannerProps {
  onScan: (code: string) => void;
  formats?: SupportedFormat[];
  autoStopOnScan?: boolean;
  enableHardwareScanner?: boolean;
  beepOnScan?: boolean;
}

interface DetectedCode {
  rawValue?: string;
}

interface BarcodeDetectorLike {
  detect: (source: HTMLVideoElement) => Promise<DetectedCode[]>;
}

interface AudioWindow extends Window {
  webkitAudioContext?: typeof AudioContext;
}

const DEFAULT_FORMATS: SupportedFormat[] = [
  "qr_code",
  "ean_13",
  "ean_8",
  "code_128",
  "code_39",
  "codabar",
  "upc_a",
  "upc_e",
];

export function BarcodeScanner({
  onScan,
  formats = DEFAULT_FORMATS,
  autoStopOnScan = true,
  enableHardwareScanner = true,
  beepOnScan = true,
}: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const bufferTimeoutRef = useRef<number | null>(null);
  const detectorRef = useRef<BarcodeDetectorLike | null>(null);
  const lastDetectedRef = useRef<{ value: string; ts: number } | null>(null);
  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");

  const detectorAvailable = useMemo(() => {
    return typeof window !== "undefined" && "BarcodeDetector" in window;
  }, []);

  const hasCamera = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return !!navigator.mediaDevices?.getUserMedia;
  }, []);

  const stopCamera = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  const playBeep = useCallback(() => {
    if (!beepOnScan || typeof window === "undefined") return;
    try {
      const audioWindow = window as AudioWindow;
      const AudioCtx = audioWindow.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioCtx();
      }
      const ctx = audioCtxRef.current;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 1200;
      gain.gain.value = 0.03;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } catch {
      // ignore audio errors
    }
  }, [beepOnScan]);

  const emitScan = useCallback(
    (value: string, source: "camera" | "manual" | "hardware") => {
      const cleanValue = value.trim();
      if (!cleanValue) return;

      const now = Date.now();
      const last = lastDetectedRef.current;
      const isDuplicate = last && last.value === cleanValue && now - last.ts < 1200;
      if (isDuplicate) return;

      lastDetectedRef.current = { value: cleanValue, ts: now };
      onScan(cleanValue);
      playBeep();

      if (source === "camera" && autoStopOnScan) {
        stopCamera();
      }
    },
    [autoStopOnScan, onScan, playBeep, stopCamera],
  );

  const startCamera = useCallback(async () => {
    if (!detectorAvailable || !hasCamera) {
      setScannerError(
        "Tu navegador no soporta escaneo por cámara. Usa ingreso manual.",
      );
      return;
    }

    try {
      setScannerError(null);
      const BarcodeDetectorCtor = (
        window as unknown as {
          BarcodeDetector: new (options: {
            formats: SupportedFormat[];
          }) => BarcodeDetectorLike;
        }
      ).BarcodeDetector;
      detectorRef.current = new BarcodeDetectorCtor({ formats });

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsScanning(true);

      const scanLoop = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current) {
          return;
        }

        try {
          if (videoRef.current.readyState >= 2) {
            const results = await detectorRef.current.detect(videoRef.current);
            const value = results[0]?.rawValue?.trim();

            if (value) {
              emitScan(value, "camera");
              if (autoStopOnScan) return;
            }
          }
        } catch {
          // keep scanning
        }

        rafRef.current = requestAnimationFrame(scanLoop);
      };

      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setScannerError(
        "No se pudo acceder a la cámara. Revisa permisos del navegador.",
      );
      stopCamera();
    }
  }, [autoStopOnScan, detectorAvailable, emitScan, formats, hasCamera, stopCamera]);

  useEffect(() => {
    if (!enableHardwareScanner || typeof window === "undefined") return;

    const clearBuffer = () => {
      scanBufferRef.current = "";
      lastKeyTimeRef.current = 0;
      if (bufferTimeoutRef.current) {
        window.clearTimeout(bufferTimeoutRef.current);
        bufferTimeoutRef.current = null;
      }
    };

    const scheduleClear = () => {
      if (bufferTimeoutRef.current) {
        window.clearTimeout(bufferTimeoutRef.current);
      }
      bufferTimeoutRef.current = window.setTimeout(clearBuffer, 120);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isEditable =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);
      if (isEditable) return;

      if (event.key === "Enter") {
        if (scanBufferRef.current.length >= 6) {
          event.preventDefault();
          emitScan(scanBufferRef.current, "hardware");
        }
        clearBuffer();
        return;
      }

      if (event.ctrlKey || event.altKey || event.metaKey) return;
      if (event.key.length !== 1) return;

      const now = Date.now();
      if (now - lastKeyTimeRef.current > 80) {
        scanBufferRef.current = "";
      }
      scanBufferRef.current += event.key;
      lastKeyTimeRef.current = now;
      scheduleClear();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      clearBuffer();
    };
  }, [emitScan, enableHardwareScanner]);

  useEffect(() => {
    return () => {
      stopCamera();
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, [stopCamera]);

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "w-full min-h-40 border-2 border-dashed rounded-lg transition-colors overflow-hidden",
          isScanning ? "border-green-500 bg-green-50" : "border-muted",
        )}
      >
        {isScanning ? (
          <div className="space-y-2 p-2">
            <video
              ref={videoRef}
              className="w-full h-44 object-cover rounded-md bg-black"
              playsInline
              muted
            />
            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                <ScanLine className="w-3 h-3" />
                Escaneando en vivo...
              </p>
              <Button
                size="sm"
                variant="outline"
                onClick={stopCamera}
                type="button"
                className="h-7 gap-1"
              >
                <CameraOff className="w-3 h-3" />
                Detener
              </Button>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground h-40 flex flex-col items-center justify-center px-3">
            <ScanLine className="w-10 h-10 mx-auto mb-2" />
            <p className="text-sm mb-2">Inicia cámara para escanear QR / barras</p>
            <Button
              size="sm"
              onClick={startCamera}
              type="button"
              className="gap-2"
              disabled={!detectorAvailable || !hasCamera}
            >
              <Camera className="w-4 h-4" />
              Iniciar cámara
            </Button>
            {!detectorAvailable && (
              <p className="text-[11px] mt-2 text-amber-600">
                BarcodeDetector no soportado en este navegador.
              </p>
            )}
          </div>
        )}
      </div>

      {scannerError && (
        <p className="text-xs text-red-600">{scannerError}</p>
      )}

      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">O ingresa manualmente:</p>
        <div className="flex gap-2">
          <Input
            placeholder="Código manual"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            maxLength={128}
            className="font-mono text-sm"
            onKeyDown={(e) => {
              if (e.key === "Enter" && manualCode.trim()) {
                e.preventDefault();
                emitScan(manualCode, "manual");
                setManualCode("");
              }
            }}
          />
          <Button
            size="sm"
            onClick={() => {
              if (!manualCode.trim()) return;
              emitScan(manualCode, "manual");
              setManualCode("");
            }}
            disabled={manualCode.length < 8}
            type="button"
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
