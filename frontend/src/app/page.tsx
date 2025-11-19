import { SiteHeader } from "@/components/header";
import { HeroSection } from "@/components/hero";
import { ModulesGrid } from "@/components/modules-grid";
import { SiteFooter } from "@/components/footer";
import { ReviewsSection } from "@/components/reviews-scrolling";
import { FadeIn } from "@/components/fade-in";
import { fetchHealth, fetchTemplates } from "@/lib/api";
import { missionCopy } from "@/lib/content";

export default async function Home() {
  const [health, templates] = await Promise.all([
    fetchHealth().catch(() => ({ ok: false })),
    fetchTemplates().catch(() => []),
  ]);

  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <FadeIn>
          <SiteHeader />
        </FadeIn>

        <main className="mt-10 flex flex-1 flex-col gap-10">
          <FadeIn delay={0.2}>
            <HeroSection mission={missionCopy} />
          </FadeIn>

          <FadeIn delay={0.4}>
            <ReviewsSection />
          </FadeIn>

          <FadeIn delay={0.6}>
            <ModulesGrid templates={templates} />
          </FadeIn>
        </main>

        <FadeIn delay={0.8}>
          <SiteFooter />
        </FadeIn>
      </div>
    </div>
  );
}
