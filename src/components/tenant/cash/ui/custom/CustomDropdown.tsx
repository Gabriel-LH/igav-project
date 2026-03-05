"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Dropdown Action
interface CustomDropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  align?: "left" | "right";
}

export function CustomDropdown({
  trigger,
  children,
  className,
  align = "right",
}: CustomDropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div
      className={cn("relative inline-block text-left", className)}
      ref={containerRef}
    >
      <div
        onClick={() => setOpen(!open)}
        className="cursor-pointer flex items-center justify-center"
      >
        {trigger}
      </div>

      {open && (
        <div
          onClick={() => setOpen(false)} // Auto close on click inside
          className={cn(
            "absolute z-50 mt-1 min-w-32 rounded-md border bg-popover p-1 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            align === "right"
              ? "right-0 origin-top-right"
              : "left-0 origin-top-left",
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}

// Popover wrapper
interface CustomPopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export function CustomPopover({
  trigger,
  children,
  className,
}: CustomPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  return (
    <div className="relative inline-block text-left" ref={containerRef}>
      <div onClick={() => setOpen(!open)} className="cursor-pointer">
        {trigger}
      </div>

      {open && (
        <div
          className={cn(
            "absolute left-0 z-50 mt-1 rounded-md border bg-popover p-2 text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95",
            className,
          )}
        >
          {children}
        </div>
      )}
    </div>
  );
}
