"use client";

import { useEffect, useState } from "react";
import QRCodeStyling from "qr-code-styling";
import type { Options } from "qr-code-styling/lib/types";

interface QRCodeDisplayProps {
  value: string;
  title: string;
  sizePx?: number;
}

export const INDUSTRIAL_QR_OPTIONS = {
  qrOptions: {
    errorCorrectionLevel: "M",
    typeNumber: 0 as const,
    mode: "Byte",
  },
  dotsOptions: {
    color: "#000000" as const,
    type: "square",
  },
  backgroundOptions: {
    color: "#ffffff" as const,
  },
  cornersSquareOptions: {
    type: "square",
  },
  cornersDotOptions: {
    type: "square",
  },
} satisfies Partial<Options>;

export function QRCodeDisplay({
  value,
  title,
  sizePx = 192,
}: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateQR = async () => {
      setIsReady(false);

      try {
        const margin = Math.max(10, Math.round(sizePx * 0.06));
        const qrInstance = new QRCodeStyling({
          width: sizePx,
          height: sizePx,
          data: value,
          margin,
          ...INDUSTRIAL_QR_OPTIONS,
        });

        const blob = await qrInstance.getRawData("png");
        if (!blob || !isMounted) return;

        const reader = new FileReader();
        reader.onloadend = () => {
          if (isMounted) {
            setQrDataUrl(reader.result as string);
            setIsReady(true);
          }
        };
        reader.readAsDataURL(blob as Blob);
      } catch (error) {
        console.error("QR Error:", error);
      }
    };

    generateQR();

    return () => {
      isMounted = false;
    };
  }, [sizePx, value]);

  return (
    <div className="flex flex-col items-center">
      <div
        className="flex items-center justify-center bg-white border rounded-sm"
        style={{ width: sizePx, height: sizePx }}
      >
        {!isReady || !qrDataUrl ? (
          <div className="w-full h-full bg-muted animate-pulse rounded-sm" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={qrDataUrl}
            alt="QR Code"
            className="w-full h-full object-contain"
          />
        )}
      </div>

      <div className="text-center w-full min-w-0">
        <p className="font-semibold text-[10px] uppercase truncate">{title}</p>
        <code className="text-[9px] font-mono text-muted-foreground block truncate">
          {value}
        </code>
      </div>
    </div>
  );
}
