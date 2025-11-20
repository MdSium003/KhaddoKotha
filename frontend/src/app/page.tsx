import { SiteHeader } from "@/components/header";
import { HeroSection } from "@/components/hero";
import { FeaturesSection } from "@/components/features";
import { HowItWorksSection } from "@/components/how-it-works";
import { TestimonialsSection } from "@/components/testimonials";
import { CTASection } from "@/components/cta-section";
import { SiteFooter } from "@/components/footer";
import { FadeIn } from "@/components/fade-in";
import { missionCopy, features, howItWorks } from "@/lib/content";

export default async function Home() {
  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <SiteHeader />

      {/* Full-width Hero Section */}
      <div className="pt-24">
        <FadeIn delay={0.1}>
          <HeroSection mission={missionCopy} />
        </FadeIn>
      </div>

      {/* Container for other sections */}
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-10">
        <main className="flex flex-1 flex-col gap-12">
          <FadeIn delay={0.2}>
            <FeaturesSection features={features} />
          </FadeIn>

          <FadeIn delay={0.3}>
            <HowItWorksSection steps={howItWorks} />
          </FadeIn>

          <FadeIn delay={0.4}>
            <TestimonialsSection />
          </FadeIn>

          <FadeIn delay={0.5}>
            <CTASection />
          </FadeIn>
        </main>

        <FadeIn delay={0.6}>
          <SiteFooter />
        </FadeIn>
      </div>
    </div>
  );
}
