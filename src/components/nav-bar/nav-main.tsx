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

export function NavMain({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon?: React.ElementType | React.ReactElement;
  }[];
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
            // aquí luego:
            // - set global state
            // - refetch data
            // - guardar en cookie/localStorage
          }}
        />
        <SidebarMenu>
          {items.map((item) => (
            <Link key={item.title} href={item.url}>
              <SidebarMenuItem>
                <SidebarMenuButton
                  className="selected:bg-primary/5 hover:cursor-pointer"
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
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}
