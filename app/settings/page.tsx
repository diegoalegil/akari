import { Settings } from "@/components/settings/Settings";
import { getSettings } from "@/lib/queries";

export const metadata = { title: "Ajustes" };
export const dynamic = "force-dynamic";

export default function SettingsPage() {
  const settings = getSettings();
  return (
    <div className="mx-auto max-w-4xl px-5 py-8 md:px-8 md:py-12">
      <h1 className="mb-7 text-2xl font-semibold tracking-tight">Ajustes</h1>
      <Settings initial={settings} />
    </div>
  );
}
