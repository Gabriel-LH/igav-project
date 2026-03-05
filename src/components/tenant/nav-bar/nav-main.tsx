"use client";

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/sidebar";
import Link from "next/link";
import React from "react";
import { SucursalSwitcher } from "./ui/SucursalSwitcher";
import { cn } from "@/lib/utils";

export function NavMain({
  items,
  pathname,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ElementType | React.ReactElement;
  }[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupContent className="flex flex-col gap-2">
        <SucursalSwitcher
          branches={[
            { id: "1", name: "Sucursal Centro" },
            { id: "2", name: "Sucursal Norte" },
            { id: "3", name: "Sucursal Sur" },
          ]}
          value="1"
          onChange={(id) => {
            console.log("Sucursal seleccionada:", id);
          }}
        />

        <SidebarMenu>
          {items.map((item) => {
            const isActive = pathname === item.url; // ✅ ahora sí

            return (
              <Link key={item.title} href={item.url}>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    className={cn(
                      "flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                        : "hover:bg-muted text-neutral-300",
                    )}
                    tooltip={item.title}
                  >
                    {item.icon &&
                      (React.isValidElement(item.icon) ? (
                        item.icon
                      ) : (
                        <item.icon />
                      ))}
                    <span>{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </Link>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
