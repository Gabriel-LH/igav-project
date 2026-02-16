"use client";

import { useEffect, useState } from "react";

interface UseBarcodeScannerProps {
  onScan: (code: string) => void;
}

export const useBarcodeScanner = ({ onScan }: UseBarcodeScannerProps) => {
  const [barcode, setBarcode] = useState("");

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Si el usuario está escribiendo en un Input (Buscador), no interceptamos
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        return;
      }

      // Si presiona Enter, asumimos que terminó el escaneo
      if (e.key === "Enter") {
        if (barcode.length > 2) { // Evitar Enters accidentales
          onScan(barcode);
          setBarcode("");
        }
        return;
      }

      // Si presiona teclas normales (números/letras), las acumulamos
      if (e.key.length === 1) {
        setBarcode((prev) => prev + e.key);

        // Los escáneres son rápidos (ms). Si pasan 100ms sin teclas, reseteamos (no fue un escáner, fue un humano lento)
        clearTimeout(timeout);
        timeout = setTimeout(() => setBarcode(""), 100);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [barcode, onScan]);
};