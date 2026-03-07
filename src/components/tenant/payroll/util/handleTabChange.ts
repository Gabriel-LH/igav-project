import { useRef } from "react";

export function useScrollableTabs() {
  const tabRefs = {
    policy: useRef<HTMLButtonElement | null>(null),
    config: useRef<HTMLButtonElement | null>(null),
    generate: useRef<HTMLButtonElement | null>(null),
    list: useRef<HTMLButtonElement | null>(null),
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
