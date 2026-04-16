"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BarcodeScanner } from "@/src/components/tenant/inventory/inventory/barcode/Scanner";
import { Camera, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ScannerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (code: string) => void;
  title?: string;
}

export function ScannerModal({
  open,
  onOpenChange,
  onScan,
  title = "Escanear Código",
}: ScannerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none shadow-2xl bg-background/95 backdrop-blur-md">
        <DialogHeader className="p-4 border-b bg-muted/30">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Camera className="w-5 h-5 text-primary" />
              </div>
              <DialogTitle className="text-lg font-bold tracking-tight">
                {title}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="p-4 bg-gradient-to-b from-muted/20 to-background">
          <BarcodeScanner 
            onScan={(code) => {
              onScan(code);
              onOpenChange(false);
            }}
            autoStopOnScan={true}
            beepOnScan={true}
          />
          
          <div className="mt-4 pt-4 border-t border-muted/50">
             <p className="text-[10px] text-center text-muted-foreground uppercase font-black tracking-widest leading-none">
               Apunta la cámara al código de barras o QR
             </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
