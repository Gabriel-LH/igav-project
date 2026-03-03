// components/inventory/QRCodeDisplay.tsx (versión defensiva máxima)
"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Printer} from "lucide-react";
import QRCodeStyling from "qr-code-styling";

interface QRCodeDisplayProps {
  value: string;
  title: string;
}

const CART_LOGO = (
  `<svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className="lucide lucide-shopping-cart-icon lucide-shopping-cart"
  >
    <circle cx="8" cy="21" r="1" />
    <circle cx="19" cy="21" r="1" />
    <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
  </svg>`
);

const cartLogoSvgDataUrl = `data:image/svg+xml,${encodeURIComponent(CART_LOGO)}`;

let globalQrInstance: QRCodeStyling | null = null;

export function QRCodeDisplay({ value, title }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateQR = async () => {
      try {
        // Usar una sola instancia global para evitar conflictos
        if (!globalQrInstance) {
          globalQrInstance = new QRCodeStyling({
            width: 200,
            height: 200,
            data: value,
            image: cartLogoSvgDataUrl,
            dotsOptions: {
              color: "#000000",
              type: "rounded",
            },
            backgroundOptions: {
              color: "#ffffff",
            },
            cornersSquareOptions: {
              type: "extra-rounded",
            },
            cornersDotOptions: {
              type: "dot",
            },
            imageOptions: {
              crossOrigin: "anonymous",
              margin: 4,
              imageSize: 0.50,
              hideBackgroundDots: true,
            },
          });
        } else {
          // Actualizar datos en instancia existente
          globalQrInstance.update({
            data: value,
          });
        }

        // Obtener blob como data URL
        const blob = await globalQrInstance.getRawData("png");
        if (!blob || !isMounted) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) {
            setQrDataUrl(reader.result as string);
            setIsReady(true);
          }
        };
        reader.readAsDataURL(blob);
      } catch (error) {
        console.error("QR Error:", error);
      }
    };

    // Delay para evitar conflictos con React render cycle
    const timer = setTimeout(generateQR, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [value]);

  const handleDownload = () => {
    if (globalQrInstance) {
      globalQrInstance.download({
        extension: "png",
        name: `qr-${value.slice(-8)}`,
      });
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="border rounded-lg p-2 bg-white w-[200px] h-[200px] flex items-center justify-center">
        {!isReady || !qrDataUrl ? (
          <div className="w-full h-full bg-muted animate-pulse rounded flex items-center justify-center">
            <span className="text-xs text-muted-foreground">Generando...</span>
          </div>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="QR Code"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="text-center space-y-1">
        <p className="font-medium text-sm">{title}</p>
        <code className="text-xs font-mono text-muted-foreground block max-w-[200px] truncate">
          {value}
        </code>
      </div>

      <Button
        size="sm"
        variant="outline"
        onClick={handleDownload}
        className="gap-2"
        disabled={!isReady}
      >
        <Printer className="w-4 h-4" />
        Descargar QR
      </Button>
    </div>
  );
}
