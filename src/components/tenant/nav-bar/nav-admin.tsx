"use client";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/sidebar";
import Link from "next/link";
import React from "react";
import { cn } from "@/lib/utils";

export function NavAdmin({
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
  const { isMobile } = useSidebar();

  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>Administración</SidebarGroupLabel>

      <SidebarMenu>
        {items.map((item) => {
          const isActive = pathname.startsWith(item.url); // mejor que ===

          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                className={cn(
                  "transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                    : "hover:bg-muted text-neutral-300",
                )}
              >
                <Link href={item.url}>
                  {item.icon &&
                    (React.isValidElement(item.icon) ? (
                      item.icon
                    ) : (
                      <item.icon />
                    ))}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
