// components/inventory/QRCodeDisplay.tsx (versión defensiva máxima)
"use client";

import { useEffect, useState } from "react";
import QRCodeStyling from "qr-code-styling";

interface QRCodeDisplayProps {
  value: string;
  title: string;
}

const CART_LOGO = `<svg
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
  </svg>`;

const cartLogoSvgDataUrl = `data:image/svg+xml,${encodeURIComponent(CART_LOGO)}`;

export function QRCodeDisplay({ value, title }: QRCodeDisplayProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const generateQR = async () => {
      try {
        const qrInstance = new QRCodeStyling({
          width: 128,
          height: 128,
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
            margin: 2,
            imageSize: 0.4,
            hideBackgroundDots: true,
          },
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
  }, [value]);

  return (
    <div className="flex flex-col items-center gap-2 p-1">
      <div className="w-[128px] h-[128px] flex items-center justify-center bg-white border rounded shadow-sm">
        {!isReady || !qrDataUrl ? (
          <div className="w-full h-full bg-muted animate-pulse rounded" />
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
        <p className="font-bold text-[10px] uppercase truncate">{title}</p>
        <code className="text-[8px] font-mono text-muted-foreground block truncate">
          {value}
        </code>
      </div>
    </div>
  );
}
