// app/(admin)/layout.tsx
import { AppSidebar } from "@/src/components/side-bar/app-sidebar";
import { SiteHeader } from "@/src/components/header/site-header";
import { SidebarInset, SidebarProvider } from "@/components/sidebar";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />

      <SidebarInset>
        <header className="sticky top-0 z-10 w-full border-b rounded-t-lg bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
          <SiteHeader />
        </header>

        {/* Contenido dinámico */}
        <div className="flex flex-1 flex-col ">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
