"use client";

import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { QRCodeDisplay } from "./QRCodeDisplay";
import { Download, PackageCheck, Printer, QrCode, X } from "lucide-react";

interface BatchQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  type: "RENT" | "SALE";
  codes: string[];
  productName: string;
  branchName: string;
}

export function BatchQRModal({
  isOpen,
  onClose,
  title,
  type,
  codes,
  productName,
  branchName,
}: BatchQRModalProps) {
  // Función para imprimir
  const handlePrint = () => {
    window.print();
  };

  // Función para descargar todos como SVG (Ideal para textilería)
  const handleDownloadAll = () => {
    console.log(`Descargando ${codes.length} archivos SVG para ${type}`);
    // Implementación futura de ZIP
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
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
            }
            .no-print {
              display: none !important;
            }
          }
        `}</style>

        <div className="flex items-center justify-between p-6 border-b no-print">
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
              <DialogTitle className="text-xl">{title}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-0.5">
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

        <div className="flex-1 overflow-y-auto p-6 md:p-10 bg-muted/20 print-area">
          {codes.length > 0 ? (
            <div className="mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-y-10 gap-x-8 justify-items-center">
              {codes.map((code, index) => (
                <div
                  key={index}
                  className=" w-fit flex flex-col items-center justify-center p-2 rounded-xl border shadow-sm print:shadow-none print:border-slate-200"
                >
                  <QRCodeDisplay value={code} title={`${type}-${index + 1}`} />
                </div>
              ))}
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-muted-foreground gap-2">
              <QrCode className="w-12 h-12 opacity-20" />
              <p>No hay códigos generados para mostrar.</p>
            </div>
          )}
        </div>

        <DialogFooter className="p-6 border-t bg-background no-print gap-3 flex-row sm:justify-end">
          <div className="flex flex-1 gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadAll}
              className="gap-2 flex-1 sm:flex-none"
            >
              <Download className="w-4 h-4" />
              Descargar SVG
            </Button>
            <Button
              variant="outline"
              onClick={handlePrint}
              className="gap-2 flex-1 sm:flex-none"
            >
              <Printer className="w-4 h-4" />
              Imprimir Etiquetas
            </Button>
          </div>
          <Button variant="ghost" onClick={onClose} className="min-w-[100px]">
            Cerrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
