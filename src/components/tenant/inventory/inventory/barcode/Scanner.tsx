"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Camera, CameraOff, ScanLine, Loader2 } from "lucide-react";
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
  format?: string;
  boundingBox?: DOMRectReadOnly;
  cornerPoints?: { x: number; y: number }[];
}

interface AudioWindow extends Window {
  AudioContext?: typeof AudioContext;
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
  const detectorRef = useRef<any>(null);
  const lastDetectedRef = useRef<{ value: string; ts: number } | null>(null);
  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);

  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState("");
  const [isPolyfillLoading, setIsPolyfillLoading] = useState(false);
  const [polyfillReady, setPolyfillReady] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [videoElementReady, setVideoElementReady] = useState(false);

  const nativeAvailable = useMemo(() => {
    return typeof window !== "undefined" && "BarcodeDetector" in window;
  }, []);

  const detectorAvailable = useMemo(() => {
    return nativeAvailable || polyfillReady;
  }, [nativeAvailable, polyfillReady]);

  // Cargar polyfill
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (nativeAvailable) {
      console.log("Usando BarcodeDetector nativo");
      return;
    }

    console.log("Cargando polyfill...");
    setIsPolyfillLoading(true);

    import("@preflower/barcode-detector-polyfill")
      .then((module) => {
        if (typeof window !== "undefined" && module.BarcodeDetectorPolyfill) {
          (window as any).BarcodeDetector = module.BarcodeDetectorPolyfill;
          console.log("✅ Polyfill listo");
          setPolyfillReady(true);
        }
        setIsPolyfillLoading(false);
      })
      .catch((err) => {
        console.error("Error cargando polyfill:", err);
        setScannerError("No se pudo cargar el escáner");
        setIsPolyfillLoading(false);
      });
  }, [nativeAvailable]);

  const hasCamera = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return !!navigator.mediaDevices?.getUserMedia;
  }, []);

  const stopCamera = useCallback(() => {
    console.log("Deteniendo cámara...");

    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => {
        track.stop();
        console.log("Track detenido:", track.kind);
      });
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
    setCameraReady(false);
  }, []);

  const playBeep = useCallback(() => {
    if (!beepOnScan || typeof window === "undefined") return;
    try {
      const audioWindow = window as AudioWindow;
      const AudioCtx =
        audioWindow.AudioContext || audioWindow.webkitAudioContext;
      if (!AudioCtx) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new AudioCtx();
      }

      if (audioCtxRef.current.state !== "running") {
        audioCtxRef.current.resume();
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
    } catch (e) {
      console.debug("Beep error (no crítico):", e);
    }
  }, [beepOnScan]);

  const emitScan = useCallback(
    (value: string, source: "camera" | "manual" | "hardware") => {
      const cleanValue = value.trim();
      if (!cleanValue) return;

      const now = Date.now();
      const last = lastDetectedRef.current;
      const isDuplicate =
        last && last.value === cleanValue && now - last.ts < 1200;

      if (isDuplicate) return;

      console.log(`✅ Escaneado (${source}):`, cleanValue);
      lastDetectedRef.current = { value: cleanValue, ts: now };
      onScan(cleanValue);
      playBeep();

      if (source === "camera" && autoStopOnScan) {
        stopCamera();
      }
    },
    [autoStopOnScan, onScan, playBeep, stopCamera],
  );

  const initializeCamera = useCallback(async () => {
    if (!detectorAvailable || !hasCamera) {
      setScannerError("No hay detector o cámara disponible");
      return false;
    }

    if (isInitializing) return false;

    setIsInitializing(true);
    setScannerError(null);
    setCameraReady(false);

    try {
      console.log("Solicitando acceso a cámara...");

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      });

      console.log("Stream obtenido, tracks:", stream.getTracks().length);
      streamRef.current = stream;

      return true;
    } catch (error: any) {
      console.error("Error accediendo a cámara:", error);

      let mensaje = "No se pudo acceder a la cámara.";
      if (error.name === "NotAllowedError") {
        mensaje =
          "Permiso de cámara denegado. Habilítalo en la configuración del navegador.";
      } else if (error.name === "NotFoundError") {
        mensaje = "No se encontró ninguna cámara en este dispositivo.";
      } else if (error.name === "NotReadableError") {
        mensaje = "La cámara está siendo usada por otra aplicación.";
      }

      setScannerError(mensaje);
      return false;
    } finally {
      setIsInitializing(false);
    }
  }, [detectorAvailable, hasCamera, isInitializing]);

  const startCamera = useCallback(async () => {
    // 1. Primero inicializar la cámara y obtener el stream
    const success = await initializeCamera();
    if (!success) return;

    // 2. Ahora que tenemos el stream, verificar que el video element existe
    if (!videoRef.current) {
      console.error("Video ref no disponible después de obtener stream");
      setScannerError("Error interno: elemento de video no disponible");
      stopCamera();
      return;
    }

    try {
      console.log("Asignando stream al video element");

      // Asignar stream al video
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.setAttribute("playsinline", "true");
      videoRef.current.muted = true;

      // Esperar a que el video esté listo
      await new Promise((resolve, reject) => {
        if (!videoRef.current) return reject("No video ref");

        const timeout = setTimeout(
          () => reject("Timeout esperando video"),
          10000,
        );

        videoRef.current.onloadedmetadata = () => {
          clearTimeout(timeout);
          videoRef.current
            ?.play()
            .then(() => {
              console.log("Video play iniciado");
              resolve(true);
            })
            .catch(reject);
        };
      });

      console.log("Video reproduciendo correctamente");
      setCameraReady(true);
      setIsScanning(true);

      // Inicializar detector
      const BarcodeDetectorCtor = (window as any).BarcodeDetector;
      detectorRef.current = new BarcodeDetectorCtor({ formats });
      console.log("Detector inicializado");

      // Loop de escaneo
      const scanLoop = async () => {
        if (!videoRef.current || !detectorRef.current || !streamRef.current) {
          return;
        }

        try {
          if (videoRef.current.readyState >= 2 && !videoRef.current.paused) {
            const results = await detectorRef.current.detect(videoRef.current);

            if (results && results.length > 0) {
              const value = results[0].rawValue?.trim();
              if (value) {
                console.log("Código detectado:", value);
                emitScan(value, "camera");
                if (autoStopOnScan) return;
              }
            }
          }
        } catch (error) {
          // Error normal en detección, ignorar
        }

        rafRef.current = requestAnimationFrame(scanLoop);
      };

      rafRef.current = requestAnimationFrame(scanLoop);
    } catch (error: any) {
      console.error("Error iniciando video:", error);
      setScannerError("Error al iniciar la reproducción de video");
      stopCamera();
    }
  }, [autoStopOnScan, emitScan, formats, initializeCamera, stopCamera]);

  // Hardware scanner
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
        if (scanBufferRef.current.length >= 4) {
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

  const cameraButtonEnabled =
    detectorAvailable && hasCamera && !isPolyfillLoading && !isInitializing;

  return (
    <div className="space-y-4">
      <div
        className={cn(
          "w-full min-h-40 border-2 border-dashed rounded-lg transition-colors overflow-hidden relative",
          isScanning ? "border-green-500 bg-green-50" : "border-muted",
        )}
      >
        {isScanning ? (
          <div className="space-y-2 p-2">
            <div className="relative w-full h-44 bg-black rounded-md overflow-hidden">
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                autoPlay
              />

              {/* Overlay de escaneo */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-32 h-32 border-2 border-green-500 rounded-lg animate-pulse opacity-50" />
              </div>

              {/* Indicador de estado */}
              {!cameraReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
            </div>

            <div className="flex items-center justify-between px-1">
              <p className="text-xs text-green-700 font-medium flex items-center gap-1">
                <ScanLine className="w-3 h-3" />
                {cameraReady
                  ? "Escaneando en vivo..."
                  : "Inicializando cámara..."}
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
            <p className="text-sm mb-2">
              Inicia cámara para escanear QR / barras
            </p>
            <Button
              size="sm"
              onClick={startCamera}
              type="button"
              className="gap-2"
              disabled={!cameraButtonEnabled}
            >
              {isInitializing ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Camera className="w-4 h-4" />
              )}
              {isInitializing ? "Iniciando..." : "Iniciar cámara"}
            </Button>

            {isPolyfillLoading && (
              <p className="text-[11px] mt-2 text-blue-600">
                Cargando escáner compatible...
              </p>
            )}
            {!detectorAvailable && !isPolyfillLoading && (
              <p className="text-[11px] mt-2 text-amber-600">
                Usa ingreso manual
              </p>
            )}
          </div>
        )}
      </div>

      {scannerError && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
          {scannerError}
        </div>
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
            disabled={manualCode.length < 3}
            type="button"
          >
            Buscar
          </Button>
        </div>
      </div>
    </div>
  );
}
