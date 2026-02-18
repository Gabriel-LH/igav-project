"use client";

import { useEffect, useState } from "react";

export function useSidebarActive(
  item: {
    url: string;
    items?: { url: string }[];
  },
  pathname: string
) {
  const isParentActive = pathname.startsWith(item.url);

  const isChildActive =
    item.items?.some((subItem) =>
      pathname.startsWith(subItem.url)
    ) ?? false;

  const [isOpen, setIsOpen] = useState(isChildActive);

  useEffect(() => {
    if (isChildActive) {
      setIsOpen(true);
    }
  }, [isChildActive]);

  return {
    isParentActive,
    isChildActive,
    isOpen,
    setIsOpen,
    isActive: isParentActive || isChildActive,
  };
}
