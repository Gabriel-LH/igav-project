"use client";

import * as React from "react";
import {
  IconCreditCard,
  IconHelp,
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
  ComputerIcon,
  CreditCardIcon,
  DashboardSquare02Icon,
  File02Icon,
  Home12Icon,
  Repeat,
  SaleTag02Icon,
  Settings01Icon,
  ShieldUserIcon,
  ShoppingBag03Icon,
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
import { ShoppingBasket } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePlanFeatures } from "@/src/hooks/usePlanFeatures";

const data = {
  user: {
    name: "Juan",
    email: "[EMAIL_ADDRESS]",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Principal",
      url: "/home",
      icon: <HugeiconsIcon icon={Home12Icon} strokeWidth={2.2} />,
    },
    {
      title: "Punto de Venta (POS)",
      url: "/pos",
      icon: <HugeiconsIcon icon={ComputerIcon} strokeWidth={2.2} />,
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
    {
      title: "Pagos",
      url: "/payments",
      icon: <HugeiconsIcon icon={CreditCardIcon} strokeWidth={2.2} />,
    },
  ],
  navRRHH: [
    {
      title: "Asistencia",
      url: "/attendance",
      icon: <HugeiconsIcon icon={CalendarUserIcon} strokeWidth={2.2} />,
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
  const pathname = usePathname();
  const { hasFeature } = usePlanFeatures();

  const filteredNavMain = React.useMemo(
    () =>
      data.navMain.filter((item) => {
        if (item.url === "/pos")
          return hasFeature("sales") || hasFeature("rentals");
        if (item.url === "/dashboard" || item.url === "/analytics")
          return (
            hasFeature("sales") ||
            hasFeature("rentals") ||
            hasFeature("inventory")
          );
        if (item.url === "/clients") return hasFeature("clients");
        return true; // home always accessible
      }),
    [hasFeature],
  );

  const filteredNavInventory = React.useMemo(
    () =>
      data.navInventory.filter((item) => {
        if (item.title === "Catálogos") return hasFeature("products");
        if (item.title === "Inventario") return hasFeature("inventory");
        return true;
      }),
    [hasFeature],
  );

  const filteredNavOperation = React.useMemo(
    () =>
      data.navOperation.filter((item) => {
        if (item.url === "/sales") return hasFeature("sales");
        if (item.url === "/rentals" || item.url === "/returns")
          return hasFeature("rentals");
        if (item.url === "/payments") return hasFeature("payments");
        return true;
      }),
    [hasFeature],
  );

  const filteredNavRRHH = React.useMemo(
    () =>
      data.navRRHH.filter((item) => {
        if (item.url === "/attendance" || item.url === "/shifts")
          return hasFeature("userAttendance");
        if (item.url === "/permissions") return hasFeature("permissions");
        if (item.url === "/branches") return hasFeature("branches");
        if (item.url === "/users") return hasFeature("users");
        return true;
      }),
    [hasFeature],
  );

  const filteredNavAdmin = React.useMemo(
    () =>
      data.navAdmin.filter((item) => {
        return hasFeature("tenants") || hasFeature("permissions");
      }),
    [hasFeature],
  );

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
                <ShoppingBasket className="size-5!" />
                <span className="text-base font-semibold italic">
                  AZRAEL SHOP
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavMain.length > 0 && (
          <NavMain items={filteredNavMain} pathname={pathname} />
        )}
        {filteredNavInventory.length > 0 && (
          <NavInventory items={filteredNavInventory} pathname={pathname} />
        )}
        {filteredNavOperation.length > 0 && (
          <NavOperation items={filteredNavOperation} pathname={pathname} />
        )}
        {filteredNavRRHH.length > 0 && (
          <NavRRHH items={filteredNavRRHH} pathname={pathname} />
        )}
        {filteredNavAdmin.length > 0 && (
          <NavAdmin items={filteredNavAdmin} pathname={pathname} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
