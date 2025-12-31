"use client";

import { IconCirclePlusFilled, IconMail, type Icon } from "@tabler/icons-react";

import { Button } from "@/components/button";
import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/sidebar";
import Link from "next/link";
import React from "react";

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
