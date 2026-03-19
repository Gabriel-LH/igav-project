"use client";

import { useState, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/badge";
import { BarcodeDisplay } from "./BarcodeDisplay";
import {
  Download,
  Printer,
  Barcode as BarcodeIcon,
  FileText,
} from "lucide-react";
import JsBarcode from "jsbarcode";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

type LabelSize = "SMALL" | "STANDARD" | "LARGE";

interface BatchBarcodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  barcode: string;
  productName: string;
  variantCode: string;
  variantName: string;
  branchName: string;
  quantity: number;
}

export function BatchBarcodeModal({
  isOpen,
  onClose,
  barcode,
  productName,
  variantCode,
  variantName,
  branchName,
  quantity,
}: BatchBarcodeModalProps) {
  const [size, setSize] = useState<LabelSize>("STANDARD");
  const containerRef = useRef<HTMLDivElement>(null);

  const sizeStyles = {
    SMALL: {
      label: "Pequeño (25x13 mm) - Solo código",
      mmW: 25,
      mmH: 13,
      showText: false,
      barW: 1,
      barH: 40,
    },
    STANDARD: {
      label: "Estándar (50x25 mm) - Código + Producto",
      mmW: 50,
      mmH: 25,
      showText: true,
      barW: 2,
      barH: 60,
    },
    LARGE: {
      label: "Grande (100x50 mm) - Completo",
      mmW: 100,
      mmH: 50,
      showText: true,
      barW: 3,
      barH: 120,
    },
  };

  const handlePrint = () => {
    window.print();
  };

  const generateFileName = (ext: string) => {
    const cleanBranch = branchName.replace(/[^a-zA-Z0-9]/g, "_").toLowerCase();
    const cleanVariant = variantCode
      .replace(/[^a-zA-Z0-9]/g, "_")
      .toLowerCase();
    return `${cleanBranch}_${cleanVariant}_x${quantity}_unid.${ext}`;
  };

  const handleDownloadSVG = () => {
    if (!containerRef.current) return;
    const svgElement = containerRef.current.querySelector("svg");
    if (!svgElement) return;

    const serializer = new XMLSerializer();
    let source = serializer.serializeToString(svgElement);

    // Add namespace if missing
    if (!source.match(/^<svg[^>]+xmlns="http\:\/\/www\.w3\.org\/2000\/svg"/)) {
      source = source.replace(
        /^<svg/,
        '<svg xmlns="http://www.w3.org/2000/svg"',
      );
    }

    // Include font and text info roughly as pure SVG by wrapping in exactly what the display shows,
    // though jsbarcode does it natively inside the SVG. But For product names, we might want to group everything.
    // For simplicity, we just download the generated jsbarcode SVG here.
    const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = generateFileName("svg");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadPDF = async () => {
    try {
      const pdfDoc = await PDFDocument.create();
      const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
      const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

      // mm to pts (1mm = 2.83465pt)
      const widthPt = currentConfig.mmW * 2.83465;
      const heightPt = currentConfig.mmH * 2.83465;

      const page = pdfDoc.addPage([widthPt, heightPt]);

      // Generar Barcode como PNG en un canvas invisible
      const canvas = document.createElement("canvas");
      const isEAN13 = /^\d{13}$/.test(barcode);
      // MULTIPLICADOR DE RESOLUCIÓN para evitar que los números se vean borrosos en el PDF
      const scaleFactor = 4;
      JsBarcode(canvas, barcode, {
        format: isEAN13 ? "EAN13" : "CODE128",
        width: currentConfig.barW * scaleFactor,
        height: currentConfig.barH * scaleFactor,
        displayValue: true,
        fontSize: 14 * scaleFactor,
        margin: 4 * scaleFactor, // Minimalist margin to make barcode as large as possible
        lineColor: "#000",
      });

      const pngUrl = canvas.toDataURL("image/png");
      const pngImage = await pdfDoc.embedPng(pngUrl);

      // Calcular escala para encajar la imagen sin que desborde el ancho o el alto
      const maxWidth = widthPt - 2; 
      const maxHeight = currentConfig.showText ? heightPt - 15 : heightPt - 2;
      
      const scaleX = maxWidth / pngImage.width;
      const scaleY = maxHeight / pngImage.height;
      const scale = Math.min(scaleX, scaleY, 0.9); // Menos restricción para maximizar tamaño

      const scaledDims = pngImage.scale(scale);
      const xOffset = (widthPt - scaledDims.width) / 2;
      const yOffset = currentConfig.showText ? (heightPt - scaledDims.height) / 2 - 4 : (heightPt - scaledDims.height) / 2;

      page.drawImage(pngImage, {
        x: xOffset,
        y: yOffset,
        width: scaledDims.width,
        height: scaledDims.height,
      });

      if (currentConfig.showText) {
        // Título Arriba: NOMBRE PRODUCTO - VARIANTE
        const titleText = `${productName.toUpperCase()} - ${variantName.toUpperCase()}`.substring(0, 40);
        const titleSize = currentConfig.mmW <= 50 ? 5.5 : 8;
        const titleW = fontBold.widthOfTextAtSize(titleText, titleSize);
        page.drawText(titleText, {
          x: (widthPt - titleW) / 2,
          y: heightPt - 8,
          size: titleSize,
          font: fontBold,
          color: rgb(0, 0, 0),
        });
        // Footer (Sucursal) se removió para diseño técnico/minimalista
      }

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = generateFileName("pdf");
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error("Error al generar PDF", err);
      alert("Hubo un error al generar el PDF de la etiqueta.");
    }
  };

  const currentConfig = sizeStyles[size];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <style jsx global>{`
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
              display: flex;
              align-items: center;
              justify-content: center;
            }
            .no-print {
              display: none !important;
            }
            @page {
              size: ${currentConfig.mmW}mm ${currentConfig.mmH}mm;
              margin: 0;
            }
          }
        `}</style>

        <div className="flex items-center justify-between p-6 border-b no-print">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-primary/10 text-primary">
              <BarcodeIcon className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl">
                Etiqueta de Código de Barras
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
                Impresión para{" "}
                <span className="font-semibold text-foreground">
                  {quantity} unidades
                </span>{" "}
                de {variantCode}
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col  flex-1 overflow-hidden no-print">
          {/* Configuración */}
          <div className="w-full flex justify-between px-4 bg-muted/10 space-y-6 overflow-y-auto">
            <div className="space-y-3">
              <Label className="text-sm font-semibold">
                Tamaño de Etiqueta
              </Label>
              <Select
                value={size}
                onValueChange={(val: LabelSize) => setSize(val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tamaño" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SMALL">
                    Pequeña (25x13 mm) - Solo Cód.
                  </SelectItem>
                  <SelectItem value="STANDARD">
                    Estándar (50x25 mm) - Cómodo
                  </SelectItem>
                  <SelectItem value="LARGE">
                    Grande (100x50 mm) - Amplio
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground mb-2">
                Información de etiqueta:
              </p>
              <div className="text-sm font-medium">{productName}</div>
              <div className="text-xs text-muted-foreground">{branchName}</div>
              <Badge variant="outline" className="mt-2 block w-fit">
                x{quantity} Unidades
              </Badge>
            </div>
          </div>

          {/* Vista previa central */}
          <div className="flex-1 overflow-y-auto p-10 bg-muted/20 flex items-center justify-center">
            {/* The actual label print simulation container */}
            <div className="bg-white border border-border rounded-md text-black pb-2 pt-1 flex flex-col items-center">
              {currentConfig.showText && (
                <div className="text-[10px] sm:text-[11px] font-bold px-2 text-center w-full truncate mb-1">
                  {productName.toUpperCase()} - {variantName.toUpperCase()}
                </div>
              )}

              <div className="flex-1 flex items-center justify-center w-full relative">
                <BarcodeDisplay
                  value={barcode}
                  width={currentConfig.barW}
                  height={currentConfig.barH}
                />
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="p-6 border-t bg-background no-print gap-3 flex-wrap sm:justify-end">
          <div className="flex flex-1 w-full sm:w-auto gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadSVG}
              className="gap-2 flex-1 sm:flex-none h-10"
              title="Descargar imagen vectorial"
            >
              <Download className="w-4 h-4" />
              SVG (<span className="text-[10px]">x{quantity}</span>)
            </Button>
            <Button
              variant="outline"
              onClick={handleDownloadPDF}
              className="gap-2 flex-1 sm:flex-none h-10"
              title="Descargar documento PDF"
            >
              <FileText className="w-4 h-4" />
              PDF (<span className="text-[10px]">x{quantity}</span>)
            </Button>
            <Button
              onClick={handlePrint}
              className="gap-2 flex-1 sm:flex-none h-10 bg-black text-white hover:bg-black/80"
            >
              <Printer className="w-4 h-4" />
              Imprimir (<span className="text-[10px]">x{quantity}</span>)
            </Button>
          </div>
          <Button
            variant="ghost"
            onClick={onClose}
            className="min-w-[100px] hidden sm:flex"
          >
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
