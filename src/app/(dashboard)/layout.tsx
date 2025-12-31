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
        {/* Top bar fijo para todas las secciones */}
        <SiteHeader />

        {/* Contenido dinámico */}
        <div className="flex flex-1 flex-col">{children}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}
