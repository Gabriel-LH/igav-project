"use client";

import * as React from "react";
import {
  IconCamera,
  IconDatabase,
  IconFileAi,
  IconFileDescription,
  IconFileWord,
  IconHelp,
  IconInnerShadowTop,
  IconReport,
  IconSearch,
  IconSettings,
} from "@tabler/icons-react";
import { HugeiconsIcon } from "@hugeicons/react";
import { NavDocuments } from "@/src/components/nav-bar/nav-documents";
import { NavMain } from "@/src/components/nav-bar/nav-main";
import { NavSecondary } from "@/src/components/nav-bar/nav-secondary";
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
  Chart02Icon,
  DashboardSquare02Icon,
  Home12Icon,
  SaleTag01Icon,
  Suit01Icon,
  UserGroupIcon,
  UserMultiple02Icon,
} from "@hugeicons/core-free-icons";
import Link from "next/link";

const data = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },

  navMain: [
    {
      title: "Principal",
      url: "/principal",
      icon: <HugeiconsIcon icon={Home12Icon} strokeWidth={2.2} />,
    },
    {
      title: "Alquilar",
      url: "/alquilar",
      icon: <HugeiconsIcon icon={Suit01Icon} strokeWidth={2.2} />,
    },
    {
      title: "Vender",
      url: "/projects",
      icon: <HugeiconsIcon icon={SaleTag01Icon} strokeWidth={2.2} />,
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
      title: "Equipo",
      url: "/team",
      icon: <HugeiconsIcon icon={UserMultiple02Icon} strokeWidth={2.2} />,
    },

    {
      title: "Clientes",
      url: "/clients",
      icon: <HugeiconsIcon icon={UserGroupIcon} strokeWidth={2.2} />,
    },
  ],
  navClouds: [
    {
      title: "Capture",
      icon: IconCamera,
      isActive: true,
      url: "/capture",
      items: [
        {
          title: "Active Proposals",
          url: "/active-proposals",
        },
        {
          title: "Archived",
          url: "/archived",
        },
      ],
    },
    {
      title: "Proposal",
      icon: IconFileDescription,
      url: "/proposal",
      items: [
        {
          title: "Active Proposals",
          url: "/active-proposals",
        },
        {
          title: "Archived",
          url: "/archived",
        },
      ],
    },
    {
      title: "Prompts",
      icon: IconFileAi,
      url: "/prompts",
      items: [
        {
          title: "Active Proposals",
          url: "/active-proposals",
        },
        {
          title: "Archived",
          url: "/archived",
        },
      ],
    },
  ],
  navSecondary: [
    {
      title: "Settings",
      url: "/settings",
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
  documents: [
    {
      name: "Data Library",
      url: "/data-library",
      icon: IconDatabase,
    },
    {
      name: "Reports",
      url: "/reports",
      icon: IconReport,
    },
    {
      name: "Word Assistant",
      url: "/word-assistant",
      icon: IconFileWord,
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
              <Link href="/dashboard">
                <IconInnerShadowTop className="size-5!" />
                <span className="text-base font-semibold">Acme Inc.</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
        <NavDocuments items={data.documents} />
        <NavSecondary items={data.navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={data.user} />
      </SidebarFooter>
    </Sidebar>
  );
}
