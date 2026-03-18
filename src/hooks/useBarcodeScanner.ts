"use client";

import { useEffect, useRef } from "react";

interface UseBarcodeScannerProps {
  onScan: (code: string) => void;
}

export const useBarcodeScanner = ({ onScan }: UseBarcodeScannerProps) => {
  // Use refs to avoid stale closures — critical for rapid scanning
  const barcodeRef = useRef("");
  const onScanRef = useRef(onScan);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Always keep the latest callback
  useEffect(() => {
    onScanRef.current = onScan;
  }, [onScan]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
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