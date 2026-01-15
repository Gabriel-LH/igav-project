"use client";

import * as React from "react";
import {
  IconCreditCard,
  IconHelp,
  IconInnerShadowTop,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { HugeiconsIcon } from "@hugeicons/react";

import { NavMain } from "@/src/components/nav-bar/nav-main";
import { NavInventory } from "@/src/components/nav-bar/nav-inventory";

import { NavUser } from "@/src/components/nav-bar/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/sidebar";

import {
  CalendarUserIcon,
  CatalogueIcon,
  Chart02Icon,
  Clock01Icon,
  CreditCardIcon,
  DashboardSquare02Icon,
  File02Icon,
  Home12Icon,
  Repeat,
  SaleTag02Icon,
  Settings01Icon,
  ShieldUserIcon,
  StoreLocation01Icon,
  Undo03Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  Wardrobe01Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { NavOperation } from "../nav-bar/nav-operation";
import { NavRRHH } from "../nav-bar/nav-rrhh";
import { NavAdmin } from "../nav-bar/nav-admin";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Principal",
      url: "/home",
      icon: <HugeiconsIcon icon={Home12Icon} strokeWidth={2.2} />,
    },
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2.2} />,
    },

    {
      title: "Analitica",
      url: "/analytics",
      icon: <HugeiconsIcon icon={Chart02Icon} strokeWidth={2.2} />,
    },
    {
      title: "Clientes",
      url: "/clients",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2.2} />,
    },
  ],
  navInventory: [
    {
      title: "Catálogos",
      icon: <HugeiconsIcon size={17} icon={CatalogueIcon} strokeWidth={2.2} />,
      isActive: true,
      url: "/catalogo",
      items: [
        { title: "Tallas", url: "/catalogos/tallas" },
        { title: "Colores", url: "/catalogos/colores" },
        { title: "Modelos", url: "/catalogos/modelos" },
        { title: "Categorías", url: "/catalogos/categorias" },
      ],
    },
    {
      title: "Inventario",
      icon: <HugeiconsIcon size={17} icon={Wardrobe01Icon} strokeWidth={2.2} />,
      url: "/inventario",
      items: [
        { title: "Prendas", url: "/inventario/prendas" },
        { title: "Agregar prenda", url: "/inventario/nuevo" },
        { title: "Stock", url: "/inventario/stock" },
      ],
    },
  ],
  navOperation: [
    {
      title: "Ventas",
      url: "/sales",
      icon: <HugeiconsIcon icon={SaleTag02Icon} strokeWidth={2.2} />,
    },
    {
      title: "Alquileres",
      url: "/rentals",
      icon: <HugeiconsIcon icon={Repeat} strokeWidth={2.2} />,
    },
    {
      title: "Devoluciones",
      url: "/returns",
      icon: <HugeiconsIcon icon={Undo03Icon} strokeWidth={2.2} />,
    }, // cambia icono si quieres
    { title: "Pagos", url: "/payments", icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2.2} />  },
  ],
  navRRHH: [
    {
      title: "Asistencia",
      url: "/attendance",
      icon: <HugeiconsIcon icon={CalendarUserIcon} strokeWidth={2.2}  />,
    },
    {
      title: "Turnos",
      url: "/shifts",
      icon: <HugeiconsIcon icon={Clock01Icon} strokeWidth={2.2} />,
    },
    {
      title: "Roles / Permisos",
      url: "/permissions",
      icon: <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={2.2} />,
    },
    {
      title: "Sucursales",
      url: "/branches",
      icon: <HugeiconsIcon icon={StoreLocation01Icon} strokeWidth={2.2} />,
    },
    {
      title: "Usuarios",
      url: "/users",
      icon: <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2.2} />,
    }, // lo que antes llamaste "Equipo"
  ],
  navAdmin: [
    {
      title: "Configuración",
      url: "/config",
      icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={2.2} />,
    },
    {
      title: "Métodos de pago",
      url: "/payments",
      icon: <IconCreditCard />,
    },
    {
      title: "Políticas",
      url: "/politicas",
      icon: <HugeiconsIcon icon={File02Icon} strokeWidth={2.2} />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/config",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/search",
      icon: IconSearch,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar collapsible="offcanvas" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5! hover:cursor-pointer"
            >
              <Link href="/home">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavInventory items={data.navInventory} />
        <NavOperation items={data.navOperation} />
        <NavRRHH items={data.navRRHH} />
        <NavAdmin items={data.navAdmin} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
