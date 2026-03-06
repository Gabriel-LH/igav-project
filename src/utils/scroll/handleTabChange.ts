import { useRef } from "react";

export function useScrollableTabs() {
  const tabRefs = {
    current: useRef<HTMLButtonElement | null>(null),
    plans: useRef<HTMLButtonElement | null>(null),
    usage: useRef<HTMLButtonElement | null>(null),
  };

  const scrollToTab = (value: keyof typeof tabRefs) => {
    const ref = tabRefs[value];

    ref?.current?.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  };

  return { tabRefs, scrollToTab };
}
