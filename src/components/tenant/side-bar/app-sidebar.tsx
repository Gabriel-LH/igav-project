"use client";

import * as React from "react";
import {
  IconCreditCard,
  IconHelp,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { HugeiconsIcon } from "@hugeicons/react";

import { NavMain } from "@/src/components/tenant/nav-bar/nav-main";
import { NavInventory } from "@/src/components/tenant/nav-bar/nav-inventory";

import { NavUser } from "@/src/components/tenant/nav-bar/nav-user";
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
  Cashier02Icon,
  CatalogueIcon,
  Chart02Icon,
  Clock01Icon,
  ComputerIcon,
  DashboardSquare02Icon,
  File02Icon,
  Home12Icon,
  Payment01Icon,
  Repeat,
  SaleTag02Icon,
  Settings01Icon,
  ShieldUserIcon,
  StoreLocation01Icon,
  Undo03Icon,
  UserGroupIcon,
  UserMultiple02Icon,
  WarehouseIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { NavOperation } from "../nav-bar/nav-operation";
import { NavRRHH } from "../nav-bar/nav-rrhh";
import { NavAdmin } from "../nav-bar/nav-admin";
import { ShoppingBasket } from "lucide-react";
import { usePathname } from "next/navigation";
import { usePlanFeatures } from "@/src/hooks/usePlanFeatures";
import { NavCRM } from "../nav-bar/nav-crm";
import { NavAnalytic } from "../nav-bar/nav-analityc";
import { User } from "@/src/types/user/type.user";
import { Tenant } from "@/src/types/tenant/type.tenant";
import { Branch } from "@/src/types/branch/type.branch";
import { useBranchStore } from "@/src/store/useBranchStore";

const data = {
  navMain: [
    {
      title: "Principal",
      url: "/tenant/home",
      icon: <HugeiconsIcon icon={Home12Icon} strokeWidth={2.2} />,
    },
    {
      title: "Punto de Venta (POS)",
      url: "/tenant/pos",
      icon: <HugeiconsIcon icon={ComputerIcon} strokeWidth={2.2} />,
    },
  ],
  navOperation: [
    {
      title: "Ventas",
      url: "/tenant/sales",
      icon: <HugeiconsIcon icon={SaleTag02Icon} strokeWidth={2.2} />,
    },
    {
      title: "Alquileres",
      url: "/tenant/rentals",
      icon: <HugeiconsIcon icon={Repeat} strokeWidth={2.2} />,
    },
    {
      title: "Devoluciones",
      url: "/tenant/returns",
      icon: <HugeiconsIcon icon={Undo03Icon} strokeWidth={2.2} />,
    }, // cambia icono si quieres
    {
      title: "Caja",
      url: "/tenant/cash",
      icon: <HugeiconsIcon icon={Cashier02Icon} strokeWidth={2.2} />,
    },
  ],
  navInventory: [
    {
      title: "Inventario",
      icon: <HugeiconsIcon size={17} icon={WarehouseIcon} strokeWidth={2.2} />,
      isActive: true,
      url: "/tenant/inventory",
      items: [
        { title: "Productos", url: "/tenant/inventory/products" },
        { title: "Recepción de Inventario", url: "/tenant/inventory/receive" },
        { title: "Stock", url: "/tenant/inventory/stock" },
        { title: "Items Serializados", url: "/tenant/inventory/items" },
        { title: "Transferencias", url: "/tenant/inventory/transfers" },
        {
          title: "Configuración de Catálogo",
          url: "/tenant/inventory/catalog-config",
        },
      ],
    },
    // {
    //   title: "Catálogos",
    //   icon: <HugeiconsIcon size={17} icon={CatalogueIcon} strokeWidth={2.2} />,
    //   url: "/tenant/catalogs",
    //   items: [
    //     { title: "Marcas", url: "/tenant/catalogs/brands" },
    //     { title: "Modelos", url: "/tenant/catalogs/models" },
    //     { title: "Categorías", url: "/tenant/catalogs/categories" },
    //     { title: "Tipos de Atributos", url: "/tenant/catalogs/attributes" },
    //     { title: "Valores de Atributos", url: "/tenant/catalogs/values" },
    //   ],
    // },
  ],
  navCRM: [
    {
      title: "Clientes",
      url: "/tenant/clients",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2.2} />,
    },
  ],
  navRRHH: [
    {
      title: "Equipo",
      url: "/tenant/team",
      icon: <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2.2} />,
    },
    {
      title: "Asistencia",
      url: "/tenant/attendance",
      icon: <HugeiconsIcon icon={CalendarUserIcon} strokeWidth={2.2} />,
    },
    {
      title: "Turnos",
      url: "/tenant/shifts",
      icon: <HugeiconsIcon icon={Clock01Icon} strokeWidth={2.2} />,
    },
    {
      title: "Nómina",
      url: "/tenant/payroll",
      icon: <HugeiconsIcon icon={Payment01Icon} strokeWidth={2.2} />,
    },
    {
      title: "Roles / Permisos",
      url: "/tenant/roles",
      icon: <HugeiconsIcon icon={ShieldUserIcon} strokeWidth={2.2} />,
    },
    {
      title: "Sucursales",
      url: "/tenant/branches",
      icon: <HugeiconsIcon icon={StoreLocation01Icon} strokeWidth={2.2} />,
    },
  ],
  navAnalytic: [
    {
      title: "Dashboard",
      url: "/tenant/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2.2} />,
    },

    {
      title: "Analitica",
      url: "/tenant/analytics",
      icon: <HugeiconsIcon icon={Chart02Icon} strokeWidth={2.2} />,
    },
  ],
  navAdmin: [
    {
      title: "Configuración",
      url: "/tenant/settings",
      icon: <HugeiconsIcon icon={Settings01Icon} strokeWidth={2.2} />,
    },
    {
      title: "Suscripción",
      url: "/tenant/subscription",
      icon: <IconCreditCard />,
    },
    {
      title: "Políticas",
      url: "/tenant/policies",
      icon: <HugeiconsIcon icon={File02Icon} strokeWidth={2.2} />,
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/tenant/setting",
      icon: IconSettings,
    },
    {
      title: "Get Help",
      url: "/tenant/help",
      icon: IconHelp,
    },
    {
      title: "Search",
      url: "/tenant/search",
      icon: IconSearch,
    },
  ],
};

interface AppSidebarProps {
  tenant: Tenant;
  user: User;
  branches: Branch[];
  membershipRoleName?: string;
  logoUrl?: string;
}

export function AppSidebar({
  tenant,
  user,
  branches,
  membershipRoleName,
  logoUrl = "",
  ...props
}: AppSidebarProps & React.ComponentProps<typeof Sidebar>) {
  const pathname = usePathname();
  const { hasFeature, hasModule } = usePlanFeatures();
  const setBranches = useBranchStore((state) => state.setBranches);
  const selectedBranchId = useBranchStore((state) => state.selectedBranchId);
  const setSelectedBranchId = useBranchStore(
    (state) => state.setSelectedBranchId,
  );
  const setCanUseGlobal = useBranchStore((state) => state.setCanUseGlobal);
  const resolvedRole = (membershipRoleName || user.role || "").toLowerCase();
  const isPrivileged = resolvedRole === "owner" || resolvedRole === "admin";

  React.useEffect(() => {
    setBranches(branches);
  }, [branches, setBranches]);

  React.useEffect(() => {
    setCanUseGlobal(isPrivileged);
  }, [isPrivileged, setCanUseGlobal]);

  React.useEffect(() => {
    if (!user.branchId) return;
    if (!selectedBranchId) {
      setSelectedBranchId(user.branchId);
      return;
    }
    const exists = branches.some((branch) => branch.id === selectedBranchId);
    if (!exists && selectedBranchId !== "global") {
      setSelectedBranchId(user.branchId);
    }
  }, [branches, user.branchId, selectedBranchId, setSelectedBranchId]);

  const filteredNavMain = React.useMemo(
    () =>
      data.navMain.filter((item) => {
        if (item.url === "/tenant/pos")
          return hasModule("sales") || hasModule("rentals");
        if (item.url === "/tenant/clients") return hasFeature("clients");
        if (item.url === "/tenant/subscriptions")
          return hasFeature("subscriptions");
        return true; // home always accessible
      }),
    [hasFeature, hasModule],
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
        if (item.url === "/tenant/sales")
          return hasModule("sales") && hasFeature("sales");
        if (item.url === "/tenant/rentals" || item.url === "/tenant/returns")
          return hasModule("rentals") && hasFeature("rentals");
        if (item.url === "/tenant/cash")
          return (
            (hasModule("sales") || hasModule("rentals")) &&
            hasFeature("payments")
          );
        return true;
      }),
    [hasFeature, hasModule],
  );

  const filteredNavRRHH = React.useMemo(
    () =>
      data.navRRHH.filter((item) => {
        if (item.url === "/tenant/attendance")
          return hasFeature("userAttendance");
        if (item.url === "/tenant/shifts") return hasFeature("shifts");
        if (item.url === "/tenant/payroll") return hasFeature("payroll");
        if (item.url === "/tenant/roles") return hasFeature("permissions");
        if (item.url === "/tenant/branches") return hasFeature("branches");
        if (item.url === "/tenant/team") return hasFeature("users");
        return true;
      }),
    [hasFeature],
  );

  const filteredNavCRM = React.useMemo(
    () =>
      data.navCRM.filter((item) => {
        if (item.url === "/tenant/clients") return hasFeature("clients");
        return true;
      }),
    [hasFeature],
  );

  const filteredNavAnalytic = React.useMemo(
    () =>
      data.navAnalytic.filter((item) => {
        if (
          item.url === "/tenant/dashboard" ||
          item.url === "/tenant/analytics"
        )
          return hasFeature("analytics");
        return true;
      }),
    [hasFeature],
  );

  const filteredNavAdmin = React.useMemo(
    () =>
      data.navAdmin.filter(() => {
        return true;
      }),
    [],
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
              <Link href="/tenant/home">
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-7 w-7 rounded-md object-cover"
                  />
                ) : (
                  <ShoppingBasket className="size-5!" />
                )}
                <span className="text-base font-semibold italic">
                  {tenant.name}
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        {filteredNavMain.length > 0 && (
          <NavMain
            branches={branches}
            items={filteredNavMain}
            pathname={pathname}
          />
        )}
        {filteredNavOperation.length > 0 && (
          <NavOperation items={filteredNavOperation} pathname={pathname} />
        )}
        {filteredNavInventory.length > 0 && (
          <NavInventory items={filteredNavInventory} pathname={pathname} />
        )}
        {filteredNavCRM.length > 0 && (
          <NavCRM items={filteredNavCRM} pathname={pathname} />
        )}
        {filteredNavRRHH.length > 0 && (
          <NavRRHH items={filteredNavRRHH} pathname={pathname} />
        )}
        {filteredNavAnalytic.length > 0 && (
          <NavAnalytic items={filteredNavAnalytic} pathname={pathname} />
        )}
        {filteredNavAdmin.length > 0 && (
          <NavAdmin items={filteredNavAdmin} pathname={pathname} />
        )}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
