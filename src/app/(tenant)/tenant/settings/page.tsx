import { SettingsHeader } from "@/src/components/tenant/settings/settings-header";
import { SettingsLayout } from "@/src/components/tenant/settings/settings-layout";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SettingsHeader />
      <SettingsLayout />
    </div>
  );
}
