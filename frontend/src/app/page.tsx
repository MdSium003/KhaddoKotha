import { SiteHeader } from "@/components/header";
import { HeroSection } from "@/components/hero";
import { ModulesGrid } from "@/components/modules-grid";
import { PlatformHighlights } from "@/components/platform-highlights";
import { SiteFooter } from "@/components/footer";
import { SystemStatusCard } from "@/components/system-status-card";
import { fetchHealth, fetchTemplates } from "@/lib/api";
import { highlightSections, missionCopy } from "@/lib/content";

export default async function Home() {
  const [health, templates] = await Promise.all([
    fetchHealth().catch(() => ({ ok: false })),
    fetchTemplates().catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <SiteHeader />

        <main className="mt-10 flex flex-1 flex-col gap-10">
          <HeroSection mission={missionCopy} />

          <section id="platform" className="grid gap-6 md:grid-cols-[1.1fr,0.9fr]">
            <PlatformHighlights highlights={highlightSections} />
            <SystemStatusCard
              ok={health.ok ?? false}
              databaseVersion={health.database_version}
            />
          </section>

          <ModulesGrid templates={templates} />
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}
