"use client";

import { useEffect, useRef } from "react";

interface UseBarcodeScannerProps {
  onScan: (code: string) => void;
  enabled?: boolean;
}

export const useBarcodeScanner = ({
  onScan,
  enabled = true,
}: UseBarcodeScannerProps) => {
  const barcodeRef = useRef("");
  const onScanRef = useRef(onScan);
  const enabledRef = useRef(enabled);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Always keep refs updated
  useEffect(() => {
    onScanRef.current = onScan;
    enabledRef.current = enabled;
  }, [onScan, enabled]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!enabledRef.current) return;

      // Si el usuario está escribiendo en un Input, no interceptamos
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      // Si presiona Enter, asumimos que terminó el escaneo
      if (e.key === "Enter") {
        if (barcodeRef.current.length > 2) {
          onScanRef.current(barcodeRef.current);
          barcodeRef.current = "";
        }
        return;
      }

      // Acumular caracteres directamente en el ref (sin re-render)
      if (e.key.length === 1) {
        barcodeRef.current += e.key;

        // Reset tras 100ms sin teclas (no fue un escáner)
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
          barcodeRef.current = "";
        }, 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []); // Empty deps — refs handle everything, no stale closures
};