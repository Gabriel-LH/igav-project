"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertCircle,
  Camera,
  Loader2,
  ScanLine,
  X,
  CheckCircle2,
  Info,
} from "lucide-react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Label } from "@/components/label";
import { cn } from "@/lib/utils"; 

/**
 * Tipos para BarcodeDetector API (Nativo en Chrome/Android)
 */
type SupportedFormat =
  | "pdf417"
  | "qr_code"
  | "code_128"
  | "code_39"
  | "ean_13";

interface DetectedBarcode {
  rawValue: string;
  format?: string;
}

interface DetectorLike {
  detect(source: CanvasImageSource): Promise<DetectedBarcode[]>;
}

interface FallbackSymbol {
  data?: string;
  decode?: string;
  rawValue?: string;
  text?: string;
}

interface AudioWindow extends Window {
  BarcodeDetector?: any;
  AudioContext?: any;
  webkitAudioContext?: any;
}

interface DniScannerProps {
  onScan: (dni: string) => void;
  employees?: any[];
}

const DEFAULT_FORMATS: SupportedFormat[] = [
  "pdf417",
  "qr_code",
  "code_128",
  "code_39",
  "ean_13",
];

export function DniScanner({ onScan }: DniScannerProps) {
  // Refs para hardware y flujo
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const detectorRef = useRef<DetectorLike | null>(null);
  const scanBufferRef = useRef("");
  const lastKeyTimeRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const isDetectingRef = useRef(false);
  const lastDetectTsRef = useRef(0);
  const fallbackCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const zbarScanRef = useRef<((imageData: ImageData) => Promise<FallbackSymbol[]>) | null>(null);

  // Estados de UI
  const [isScanning, setIsScanning] = useState(false);
  const [scannerError, setScannerError] = useState<string | null>(null);
  const [manualDni, setManualDni] = useState("");
  const [cameraReady, setCameraReady] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [fallbackReady, setFallbackReady] = useState(false);
  const [debugStatus, setDebugStatus] = useState<string>("Inactivo");
  const [showFlash, setShowFlash] = useState(false);

  // Disponibilidad de APIs
  const nativeAvailable = useMemo(() => {
    return typeof window !== "undefined" && "BarcodeDetector" in window;
  }, []);

  const hasCamera = useMemo(() => {
    if (typeof navigator === "undefined") return false;
    return !!navigator.mediaDevices?.getUserMedia;
  }, []);

  // --- CARGA DE FALLBACK (ZBAR WASM) ---
  const loadFallbackDetector = useCallback(async () => {
    if (typeof window === "undefined" || fallbackReady) return;

    try {
      const url = "https://esm.sh/@undecaf/zbar-wasm@0.11.0";
      // Hack para bypassar Turbopack/Webpack y realizar import nativo en runtime
      const zbarModule = await new Function('u', 'return import(u)')(url);
      const { scanImageData } = zbarModule;
      zbarScanRef.current = scanImageData;
      setFallbackReady(true);
      console.log("DniScanner: Fallback ZBar cargado correctamente (Runtime).");
    } catch (err) {
      console.warn("DniScanner: No se pudo cargar el detector alternativo.", err);
    }
  }, [fallbackReady]);

  useEffect(() => {
    void loadFallbackDetector();
  }, [loadFallbackDetector]);

  // --- CONTROL DE AUDIO (Beep) ---
  const playBeep = useCallback(() => {
    try {
      const audioWin = window as AudioWindow;
      const Ctor = audioWin.AudioContext || audioWin.webkitAudioContext;
      if (!Ctor) return;

      if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
        audioCtxRef.current = new Ctor();
      }
      const ctx = audioCtxRef.current;
      if (ctx!.state === "suspended") void ctx!.resume();

      const osc = ctx!.createOscillator();
      const gain = ctx!.createGain();
      osc.type = "sine";
      osc.frequency.value = 1200;
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(ctx!.destination);
      osc.start();
      osc.stop(ctx!.currentTime + 0.1);
      setDebugStatus("¡Éxito!");
    } catch (e) {
      console.debug("Beep fail:", e);
    }
  }, []);

  // --- EMISIÓN DE RESULTADO ---
  const stopCamera = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
    setCameraReady(false);
    setDebugStatus("Detenido");
  }, []);

  const emitScan = useCallback((value: string) => {
    const cleanValue = value.trim();
    if (!cleanValue) return;

    setShowFlash(true);
    setTimeout(() => {
      onScan(cleanValue);
      playBeep();
      stopCamera();
      setManualDni("");
      setShowFlash(false);
    }, 150);
  }, [onScan, playBeep, stopCamera]);

  // --- CICLO DE ESCANEO ---
  const startCamera = useCallback(async () => {
    if (isInitializing) return;
    setIsInitializing(true);
    setScannerError(null);
    setCameraReady(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false,
      });

      streamRef.current = stream;
      if (!videoRef.current) throw new Error("Video element missing");
      videoRef.current.srcObject = stream;
      
      await videoRef.current.play();
      setCameraReady(true);
      setIsScanning(true);
      setDebugStatus("Buscando código...");

      // Init Detector Nativo
      const AudioWin = window as AudioWindow;
      if (AudioWin.BarcodeDetector) {
        detectorRef.current = new AudioWin.BarcodeDetector({ formats: DEFAULT_FORMATS });
      }

      const scanLoop = async () => {
        if (!videoRef.current || !isScanning) return;

        try {
          const now = Date.now();
          if (now - lastDetectTsRef.current < 80 || isDetectingRef.current) {
            rafRef.current = requestAnimationFrame(scanLoop);
            return;
          }

          if (videoRef.current.readyState < 2) {
             rafRef.current = requestAnimationFrame(scanLoop);
             return;
          }

          isDetectingRef.current = true;
          lastDetectTsRef.current = now;

          let detectedValue: string | null = null;
          const video = videoRef.current;
          const vw = video.videoWidth;
          const vh = video.videoHeight;

          if (vw > 0 && vh > 0) {
            // ROI: Región de Interés centrada (70% del centro)
            const roiSize = Math.min(vw, vh) * 0.8;
            const sx = (vw - roiSize) / 2;
            const sy = (vh - roiSize) / 2;

            const canvas = fallbackCanvasRef.current || document.createElement("canvas");
            fallbackCanvasRef.current = canvas;
            canvas.width = roiSize;
            canvas.height = roiSize;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });

            if (ctx) {
              // Dibujar recorte centrado para mejorar precisión
              ctx.drawImage(video, sx, sy, roiSize, roiSize, 0, 0, roiSize, roiSize);
              
              // Pre-procesamiento: Escala de Grises y Contraste
              const imageData = ctx.getImageData(0, 0, roiSize, roiSize);
              const data = imageData.data;
              for (let i = 0; i < data.length; i += 4) {
                // Luminancia (Grayscale)
                const avg = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114);
                // Aumento de Contraste (S-Curve simple)
                const contrast = 1.2; 
                const color = contrast * (avg - 128) + 128;
                data[i] = data[i + 1] = data[i + 2] = color;
              }
              ctx.putImageData(imageData, 0, 0);

              // 1. Intento Nativo (en el canvas pre-procesado para mayor éxito)
              if (detectorRef.current) {
                try {
                  const bcs = await detectorRef.current.detect(canvas);
                  if (bcs.length > 0) detectedValue = bcs[0].rawValue;
                } catch (e) {
                  console.debug("Native detect fail on canvas:", e);
                }
              }

              // 2. Intento Fallback (ZBar) en el mismo canvas
              if (!detectedValue && zbarScanRef.current) {
                try {
                  const symbols = await zbarScanRef.current(ctx.getImageData(0, 0, roiSize, roiSize));
                  if (symbols && symbols.length > 0) {
                    const s = symbols[0];
                    detectedValue = s.data || s.decode || s.rawValue || s.text || null;
                  }
                } catch (e) {
                  console.debug("Fallback detect fail:", e);
                }
              }
            }
          }

          if (detectedValue) {
            emitScan(detectedValue);
          } else {
             rafRef.current = requestAnimationFrame(scanLoop);
          }
        } finally {
          isDetectingRef.current = false;
        }
      };

      rafRef.current = requestAnimationFrame(scanLoop);
    } catch (err: any) {
      console.error("DniScanner Start Error:", err);
      setScannerError(err.name === "NotAllowedError" ? "Permiso de cámara denegado." : "No se pudo iniciar la cámara.");
      stopCamera();
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isScanning, emitScan, stopCamera]);

  // --- EVENTOS TECLADO (Lectores físicos) ---
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT") return;

      if (e.key === "Enter" && scanBufferRef.current.length >= 4) {
        emitScan(scanBufferRef.current);
        scanBufferRef.current = "";
        return;
      }
      if (e.key.length === 1) {
        const now = Date.now();
        if (now - lastKeyTimeRef.current > 100) scanBufferRef.current = "";
        scanBufferRef.current += e.key;
        lastKeyTimeRef.current = now;
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [emitScan]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="flex flex-col gap-4 p-1">
      {/* Área de Cámara */}
      <div className={cn(
        "relative h-56 w-full overflow-hidden rounded-xl bg-slate-950 border-2 border-dashed transition-all",
        isScanning ? "border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]" : "border-slate-800"
      )}>
        <video
          ref={videoRef}
          className={cn("h-full w-full object-cover", cameraReady ? "opacity-100" : "opacity-0")}
          playsInline
          muted
        />

        {!isScanning && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
            <ScanLine className="mb-3 h-12 w-12 text-slate-700" />
            <p className="mb-4 text-sm text-slate-500">
              Escanea el código del documento o usa el ingreso manual
            </p>
            <Button
              onClick={startCamera}
              disabled={isInitializing || (!hasCamera && !nativeAvailable)}
              className="gap-2 bg-emerald-600 hover:bg-emerald-50 text-white shadow-lg"
            >
              {isInitializing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Camera className="h-4 w-4" />}
              {isInitializing ? "Iniciando..." : "Cámara"}
            </Button>
          </div>
        )}

        {isScanning && (
          <>
            <div className="absolute top-3 left-3 z-20 flex items-center gap-2 rounded-full bg-black/60 backdrop-blur-md px-3 py-1.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/30">
              <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              {debugStatus}
            </div>
            
            {/* ROI Overlay */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
               <div className="w-40 h-40 border-2 border-emerald-500/40 rounded-lg animate-pulse" />
            </div>

            {showFlash && (
              <div className="absolute inset-0 z-30 bg-white/60 animate-in fade-in duration-150" />
            )}

            <div className="pointer-events-none absolute inset-0 m-8 rounded-lg border-[2px] border-emerald-500/20 ring-1 ring-emerald-500/10 shadow-[inset_0_0_40px_rgba(16,185,129,0.1)]" />
            <Button
              size="icon"
              variant="destructive"
              className="absolute top-3 right-3 h-8 w-8 rounded-full shadow-lg"
              onClick={stopCamera}
            >
              <X className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      {scannerError && (
        <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 p-3 text-xs text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{scannerError}</span>
        </div>
      )}

      {/* Ingreso Manual / Pruebas */}
      <div className="space-y-3 rounded-xl bg-slate-400/50 p-3 border border-slate-400">
        <div className="flex items-center justify-between">
          <Label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
            Ficha de Empleado
          </Label>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => emitScan("87654321")}
            className="h-6 px-2 text-[9px] text-slate-400 hover:text-emerald-500 hover:bg-emerald-50"
          >
            <CheckCircle2 className="mr-1 h-3 w-3" /> Simular Escaneo
          </Button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              placeholder="Nro DNI..."
              value={manualDni}
              onChange={(e) => setManualDni(e.target.value)}
              className="h-9 font-mono tracking-[0.2em] text-center pr-8"
              onKeyDown={(e) => {
                if (e.key === "Enter" && manualDni.length >= 4) emitScan(manualDni);
              }}
            />
            <Info className="absolute right-2 top-2.5 h-4 w-4 text-slate-300" />
          </div>
          <Button
            onClick={() => emitScan(manualDni)}
            disabled={manualDni.length < 4}
            className="h-9 bg-slate-900 text-white"
          >
            Ingresar
          </Button>
        </div>
      </div>
    </div>
  );
}
