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

// Componente separado para el icono
function InventoryIcon({
  icon,
}: {
  icon: React.ElementType | React.ReactElement;
}) {
  return React.isValidElement(icon) ? icon : React.createElement(icon);
}

export function NavInventory({
  items,
}: {
  items: {
    title: string;
    url: string;
    icon: React.ElementType | React.ReactElement;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}) {
  return (
    <SidebarGroup>
      <SidebarGroupLabel>Inventario</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <NavInventoryItem key={item.title} item={item} />
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}

function NavInventoryItem({ item }: { item: any }) {
  const [isOpen, setIsOpen] = React.useState(false);

  const handleToggle = (e: React.MouseEvent) => {
    if (item.items?.length) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isOpen}
        onClick={handleToggle}
        asChild={!item.items?.length}
      >
        {item.items?.length ? (
          <div className="flex w-full items-center">
            <InventoryIcon icon={item.icon} />
            <span className="ml-2 flex-1 text-left text-sm">{item.title}</span>
            <ChevronRight
              className={`ml-auto size-4 transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </div>
        ) : (
          <Link href={item.url} className="flex w-full items-center">
            <InventoryIcon icon={item.icon} />
            <span className="ml-2 text-sm">{item.title}</span>
          </Link>
        )}
      </SidebarMenuButton>
      {item.items?.length && isOpen && (
        <SidebarMenuSub>
          {item.items.map((subItem: any) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton asChild>
                <Link href={subItem.url}>
                  <span className="text-sm">{subItem.title}</span>
                </Link>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
