"use client";

import * as React from "react";
import { ChevronRight } from "lucide-react";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "@/components/sidebar";
import Link from "next/link";
import { useSidebarActive } from "@/src/hooks/useSideBarActive";

function InventoryIcon({
  icon,
}: {
  icon: React.ElementType | React.ReactElement;
}) {
  return React.isValidElement(icon) ? icon : React.createElement(icon);
}

function NavInventoryItem({
  items,
  pathname,
}: {
  items: any;
  pathname: string;
}) {
  const { isActive, isOpen, setIsOpen } = useSidebarActive(items, pathname);

  const handleToggle = (e: React.MouseEvent) => {
    if (items.items?.length) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={items.title}
        isActive={isActive}
        onClick={handleToggle}
        asChild={!items.items?.length}
      >
        {items.items?.length ? (
          <div className="flex w-full items-center">
            <InventoryIcon icon={items.icon} />
            <span className="ml-2 flex-1 text-left text-sm">{items.title}</span>
            <ChevronRight
              className={`ml-auto size-4 transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </div>
        ) : (
          <Link href={items.url} className="flex w-full items-center">
            <InventoryIcon icon={items.icon} />
            <span className="ml-2 text-sm">{items.title}</span>
          </Link>
        )}
      </SidebarMenuButton>

      {items.items?.length && isOpen && (
        <SidebarMenuSub>
          {items.items.map((subItem: any) => {
            const isSubActive = pathname.startsWith(subItem.url);

            return (
              <SidebarMenuSubItem key={subItem.title}>
                <SidebarMenuSubButton
                  asChild
                  className={
                    isSubActive
                      ? "bg-primary/10 text-primary font-medium border-l-2 border-primary"
                      : "hover:bg-muted text-neutral-300"
                  }
                >
                  <Link href={subItem.url}>
                    <span className="text-sm">{subItem.title}</span>
                  </Link>
                </SidebarMenuSubButton>
              </SidebarMenuSubItem>
            );
          })}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}

export function NavInventory({
  items,
  pathname,
}: {
  items: any[];
  pathname: string;
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Inventario</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavInventoryItem
            key={item.title}
            items={item} // 👈 ahora sí es un objeto individual
            pathname={pathname}
          />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
