// components/shared/EntityModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

import { ScrollArea } from "@/components/ui/scroll-area";
import { ReactNode, useState } from "react";

interface EntityModalProps {
  title: string;
  description?: string;
  trigger?: ReactNode;
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "full";
}

const maxWidthClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
  full: "max-w-4xl",
};

export function EntityModal({
  title,
  description,
  trigger,
  children,
  open: controlledOpen,
  onOpenChange,
  maxWidth = "lg",
}: EntityModalProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const open = controlledOpen ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className={`${maxWidthClasses[maxWidth]} max-h-[90vh]`}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <ScrollArea className="max-h-[calc(90vh-8rem)] pr-4">
          {children}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Hook para controlar modales
export function useEntityModal() {
  const [open, setOpen] = useState(false);
  const [entityId, setEntityId] = useState<string | null>(null);

  const openModal = (id?: string) => {
    setEntityId(id || null);
    setOpen(true);
  };

  const closeModal = () => {
    setOpen(false);
    setEntityId(null);
  };

  return { open, setOpen, entityId, openModal, closeModal, isEditing: !!entityId };
}