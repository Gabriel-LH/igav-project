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
import { size } from "zod";

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
    // Only toggle if we have items.
    if (item.items?.length) {
      e.preventDefault();
      setIsOpen(!isOpen);
    }
  };

  // Handle icon rendering
  const IconComponent = () => {
    return React.isValidElement(item.icon) ? item.icon : <item.icon />;
  };
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={item.title}
        isActive={isOpen}
        onClick={handleToggle}
        asChild={!item.items?.length} // Si no hay elementos, es un enlace (¿gestionado por el enlace principal o por el comportamiento estándar?)
        // Si tiene elementos, es un botón. Si no, ¿podría ser un enlace?
        // En los datos, tiene 'url'.
        // Si tiene elementos, normalmente no navegamos a 'url' al hacer clic, sino que alternamos.
        // Si el usuario desea AMBOS, es complejo. Shadcn suele alternar.
      >
        {/* Si no hay elementos, ¿es necesario encapsularlos entre <a> o Link?
            Pero SidebarMenuButton puede ser 'asChild'.
            Hagámoslo simple: si tiene elementos, es un botón de alternancia. Si no hay elementos, es un enlace.
            */}
        {item.items?.length ? (
          <div className="flex w-full items-center">
            <IconComponent />
            <span className="ml-2 flex-1 text-left text-sm">{item.title}</span>
            <ChevronRight
              className={`ml-auto size-4 transition-transform duration-200 ${
                isOpen ? "rotate-90" : ""
              }`}
            />
          </div>
        ) : (
          <a href={item.url} className="flex w-full items-center">
            <IconComponent />
            <span className="ml-2 text-sm">{item.title}</span>
          </a>
        )}
      </SidebarMenuButton>
      {item.items?.length && isOpen && (
        <SidebarMenuSub>
          {item.items.map((subItem: any) => (
            <SidebarMenuSubItem key={subItem.title}>
              <SidebarMenuSubButton asChild>
                <a href={subItem.url}>
                  <span className="text-sm">{subItem.title}</span>
                </a>
              </SidebarMenuSubButton>
            </SidebarMenuSubItem>
          ))}
        </SidebarMenuSub>
      )}
    </SidebarMenuItem>
  );
}
