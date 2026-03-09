"use client";

import * as React from "react";
import { HugeiconsIcon } from "@hugeicons/react";

import { SuperAdminNavMain } from "../nav-bar/ui/superadmin-nav-main";

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
  Card,
  CreditCardPosIcon,
  Crown02Icon,
  DashboardSquare02Icon,
  Diamond02Icon,
  Robot01Icon,
  UserGroupIcon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavBilling } from "../nav-bar/ui/superadmin-nav-billing";
import { SuperAdminNavUser } from "../nav-bar/ui/Superadmin-nav-user";
import { User } from "@/src/types/user/type.user";

const data = {
  navMain: [
    {
      title: "Dashboard",
      url: "/superadmin/dashboard",
      icon: <HugeiconsIcon icon={DashboardSquare02Icon} strokeWidth={2.2} />,
    },
    {
      title: "Tenants",
      url: "/superadmin/tenants",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2.2} />,
    },
    {
      title: "Suscripciones",
      url: "/superadmin/subscriptions",
      icon: <HugeiconsIcon icon={Card} strokeWidth={2.2} />,
    },
  ],

  navBilling: [
    {
      title: "Facturación",
      url: "/superadmin/billing",
      icon: <HugeiconsIcon icon={CreditCardPosIcon} className="w-5 h-5" />,
      items: [
        {
          title: "Planes",
          url: "/superadmin/billing/plans",
          icon: <HugeiconsIcon icon={Crown02Icon} strokeWidth={2.2} />,
        },

        {
          title: "Features",
          url: "/superadmin/billing/features",
          icon: <HugeiconsIcon icon={Diamond02Icon} strokeWidth={2.2} />,
        },
      ],
    },
  ],
};

interface SuperAdminAppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  user: User;
}

export function SuperAdminAppSidebar({
  user,
  ...props
}: SuperAdminAppSidebarProps) {
  const pathname = usePathname();
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
                <HugeiconsIcon
                  icon={Robot01Icon}
                  strokeWidth={3}
                  className="size-5!"
                />
                <span className="text-base font-semibold italic">
                  I.G.A.V. SISTEMA
                </span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SuperAdminNavMain items={data.navMain} pathname={pathname} />
        <NavBilling items={data.navBilling} pathname={pathname} />
      </SidebarContent>
      <SidebarFooter>
        <SuperAdminNavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  );
}
