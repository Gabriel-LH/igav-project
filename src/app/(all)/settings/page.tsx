import { SettingsHeader } from "@/src/components/settings/settings-header";
import { SettingsLayout } from "@/src/components/settings/settings-layout";

export default function SettingsPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <SettingsHeader />
      <SettingsLayout />
    </div>
  );
}
