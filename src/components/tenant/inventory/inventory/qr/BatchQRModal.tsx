"use client";

import { useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { INDUSTRIAL_QR_OPTIONS, QRCodeDisplay } from "./QRCodeDisplay";
import { Download, PackageCheck, Printer, QrCode } from "lucide-react";
import { PDFDocument } from "pdf-lib";
import QRCodeStyling from "qr-code-styling";

interface BatchQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "RENT" | "SALE";
  codes: string[];
  productName: string;
  variantName?: string;
  branchName: string;
}

type QrSizeOption = {
  label: string;
  mm: number;
  px: number;
  exportPx: number;
};

const QR_SIZE_OPTIONS: QrSizeOption[] = [
  { label: "25 mm", mm: 25, px: 140, exportPx: 840 },
  { label: "30 mm", mm: 30, px: 168, exportPx: 1024 },
  { label: "40 mm", mm: 40, px: 220, exportPx: 1280 },
];

const sanitizeFilePart = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

export function BatchQRModal({
  isOpen,
  onClose,
  title,
  type,
  codes,
  productName,
  variantName,
  branchName,
}: BatchQRModalProps) {
  const [selectedSizeMm, setSelectedSizeMm] = useState<number>(30);

  const selectedSize = useMemo(
    () =>
      QR_SIZE_OPTIONS.find((option) => option.mm === selectedSizeMm) ??
      QR_SIZE_OPTIONS[1],
    [selectedSizeMm],
  );

  const safeBranch = sanitizeFilePart(branchName) || "sucursal";
  const safeType = type.toLowerCase();
  const safeProduct = sanitizeFilePart(productName) || "producto";

  const buildFileName = (code: string, index: number) => {
    const safeCode =
      sanitizeFilePart(code).slice(-24) || String(index + 1).padStart(3, "0");

    return `${safeBranch}-${safeType}-${safeProduct}-${String(index + 1).padStart(3, "0")}-${selectedSize.mm}mm-${safeCode}.svg`;
  };

  const buildBatchBaseName = () =>
    `${safeBranch}-${safeType}-${safeProduct}-${codes.length}qr-${selectedSize.mm}mm`;

  const buildSvgBlob = async (code: string) => {
    // Minimalist padding for QR to maximize scannability
    const margin = 2;
    const qrInstance = new QRCodeStyling({
      width: selectedSize.exportPx,
      height: selectedSize.exportPx,
      data: code,
      margin,
      ...INDUSTRIAL_QR_OPTIONS,
    });

    const rawSvg = await qrInstance.getRawData("svg");
    if (!rawSvg) return null;

    const rawText = await (rawSvg as Blob).text();
    const svgWithPhysicalSize = rawText
      .replace(/width="[^"]*"/, `width="${selectedSize.mm}mm"`)
      .replace(/height="[^"]*"/, `height="${selectedSize.mm}mm"`)
      .replace(
        /viewBox="[^"]*"/,
        `viewBox="0 0 ${selectedSize.exportPx} ${selectedSize.exportPx}"`,
      );

    return new Blob([svgWithPhysicalSize], {
      type: "image/svg+xml;charset=utf-8",
    });
  };

  const buildPngBlob = async (code: string) => {
    // Minimalist padding for QR to maximize scannability
    const margin = 2;
    const qrInstance = new QRCodeStyling({
      width: selectedSize.exportPx,
      height: selectedSize.exportPx,
      data: code,
      margin,
      ...INDUSTRIAL_QR_OPTIONS,
    });

    const rawPng = await qrInstance.getRawData("png");
    if (!rawPng) return null;

    return rawPng as Blob;
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadAll = async () => {
    for (const [index, code] of codes.entries()) {
      const svgBlob = await buildSvgBlob(code);
      if (!svgBlob) continue;

      downloadBlob(svgBlob, buildFileName(code, index));

      if (codes.length > 1) {
        await new Promise((resolve) => window.setTimeout(resolve, 150));
      }
    }
  };

  const handleDownloadPdf = async () => {
    try {
      const { StandardFonts, rgb } = await import("pdf-lib");
      const pdfDoc = await PDFDocument.create();
      const pageSizeInPoints = (selectedSize.mm * 72) / 25.4;

      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      for (const [index, code] of codes.entries()) {
        const pngBlob = await buildPngBlob(code);
        if (!pngBlob) continue;

        const pngBytes = await pngBlob.arrayBuffer();
        const pngImage = await pdfDoc.embedPng(pngBytes);
        const page = pdfDoc.addPage([pageSizeInPoints, pageSizeInPoints]);

        // Dibujamos el QR dejando margen arriba (título) y abajo (código)
        // Usamos un 75% del tamaño para el QR, dejando espacio
        const qrSize = pageSizeInPoints * 0.75;
        const xOffset = (pageSizeInPoints - qrSize) / 2;
        const yOffset = (pageSizeInPoints - qrSize) / 2; // Dibujamos centrado

        page.drawImage(pngImage, {
          x: xOffset,
          y: yOffset,
          width: qrSize,
          height: qrSize,
        });

        const titleText = variantName
          ? `${productName.toUpperCase()} - ${variantName.toUpperCase()}`
          : productName.toUpperCase();

        const codeText = code;

        const isSmall = selectedSize.mm === 25;
        const titleFontSize = isSmall ? 4 : 5.5;
        const codeFontSize = isSmall ? 3.5 : 4.5;

        const wTitle = fontBold.widthOfTextAtSize(titleText, titleFontSize);
        const wCode = fontRegular.widthOfTextAtSize(codeText, codeFontSize);

        // Texto Arriba
        page.drawText(titleText, {
          x: (pageSizeInPoints - wTitle) / 2,
          y: pageSizeInPoints - 6,
          size: titleFontSize,
          font: fontBold,
          color: rgb(0, 0, 0),
        });

        // Código Crudo Abajo
        page.drawText(codeText, {
          x: (pageSizeInPoints - wCode) / 2,
          y: 4,
          size: codeFontSize,
          font: fontRegular,
          color: rgb(0.2, 0.2, 0.2),
        });
      }

      const pdfBytes = await pdfDoc.save();
      const pdfBuffer = pdfBytes.buffer.slice(
        pdfBytes.byteOffset,
        pdfBytes.byteOffset + pdfBytes.byteLength,
      );
      const pdfBlob = new Blob([pdfBuffer], { type: "application/pdf" });
      downloadBlob(pdfBlob, `${buildBatchBaseName()}.pdf`);
    } catch (err) {
      console.error(err);
      alert("Error al generar PDF del Lote QR.");
    }
  };

  const downloadSvgLabel =
    codes.length === 1 ? "SVG" : `Lote SVG (${codes.length})`;
  const printLabel = codes.length === 1 ? "Etiqueta" : "Plancha";

  const downloadPdfLabel =
    codes.length === 1 ? "PDF" : `Lote PDF (${codes.length})`;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className=" flex flex-col p-0">
        <style jsx global>{`
          @page {
            size: auto;
            margin: 8mm;
          }

          @media print {
            body * {
              visibility: hidden;
            }
            .print-area,
            .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
              padding: 0;
              margin: 0;
              background: white;
            }
            .print-sheet {
              display: grid;
              grid-template-columns: repeat(
                auto-fill,
                minmax(var(--qr-size-mm), 1fr)
              );
              gap: 6mm;
              justify-items: center;
              align-items: start;
            }
            .print-tile {
              width: var(--qr-size-mm);
              break-inside: avoid;
              page-break-inside: avoid;
              border: none !important;
              box-shadow: none !important;
              padding: 0 !important;
            }
            .print-qr-box {
              width: var(--qr-size-mm) !important;
              height: var(--qr-size-mm) !important;
            }
            .print-meta-top {
              margin-bottom: 0mm;
              font-size: 7pt !important;
              font-weight: 700;
              text-transform: uppercase;
              text-align: center;
              line-height: 1.1;
            }
            .print-meta-bottom {
              margin-top: 0mm;
              font-size: 6pt !important;
              font-family: monospace;
              text-align: center;
              line-height: 1.1;
              color: #444;
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <div className="flex items-center -mb-2 justify-between p-4 border-b no-print">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-full ${
                type === "RENT"
                  ? "bg-blue-100 text-blue-600"
                  : "bg-green-100 text-green-600"
              }`}
            >
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-sm">{title}</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Sucursal:{" "}
                <span className="font-semibold text-foreground">
                  {branchName}
                </span>{" "}
                | Producto:{" "}
                <span className="font-semibold text-foreground">
                  {productName}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="border-b px-4 w-full no-print pb-2">
          <div className="grid grid-cols-1  md:justify-between ">
            <div className="space-y-2 flex justify-between items-center">
              <p className="text-sm pt-2 font-medium">
                Tamaño de etiqueta QR:{" "}
              </p>
              <div className="flex gap-2">
                {QR_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.mm}
                    type="button"
                    onClick={() => setSelectedSizeMm(option.mm)}
                    className={`rounded-md border px-3 py-2 text-sm ${
                      selectedSize.mm === option.mm
                        ? "border-foreground bg-foreground text-background"
                        : "border-border bg-background"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div
          className="flex-1 max-h-[280px] overflow-y-auto p-4 md:p-6 bg-muted/20 print-area "
          style={
            {
              ["--qr-size-mm" as string]: `${selectedSize.mm}mm`,
            } as React.CSSProperties
          }
        >
          {codes.length > 0 ? (
            <div
              className={`mx-auto grid grid-cols-1  gap-6 justify-items-center print-sheet ${selectedSize.mm === 25 ? "sm:grid-cols-2 xl:grid-cols-3" : selectedSize.mm === 30 ? "sm:grid-cols-1 xl:grid-cols-2" : ""} `}
            >
              {codes.map((code, index) => (
                <div
                  key={index}
                  className="w-fit flex flex-col items-center justify-center p-2 rounded-lg border shadow-sm print-tile"
                >
                  <div className="print-qr-box">
                    <QRCodeDisplay
                      value={code}
                      title={`${productName} - ${variantName}`}
                      sizePx={selectedSize.px}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <QrCode className="w-12 h-12 opacity-20" />
              <p>No hay codigos generados para mostrar.</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-background no-print gap-3 w-full">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 w-full">
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              className="gap-2 flex-1"
              disabled={codes.length === 0}
            >
              <Download className="w-4 h-4" />
              {downloadSvgLabel}
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPdf}
              className="gap-2 flex-1"
              disabled={codes.length === 0}
            >
              <Download className="w-4 h-4" />
              {downloadPdfLabel}
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2 flex-1"
              disabled={codes.length === 0}
            >
              <Printer className="w-4 h-4" />
              {printLabel}
            </Button>

            <Button variant="ghost" className="w-fit" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
