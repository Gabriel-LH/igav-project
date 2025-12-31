import { AppSidebar } from "@/src/components/side-bar/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/sidebar";

export default function AnalyticsPage() {
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
        <h1>Analytics</h1>
      </SidebarInset>
    </SidebarProvider>
  );
}
