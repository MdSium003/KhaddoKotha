type HeroProps = {
  mission: string;
};

export function HeroSection({ mission }: HeroProps) {
  return (
    <section
      id="mission"
      className="relative w-full overflow-hidden"
    >
      {/* Hero Image */}
      <img
        src="/hero.png"
        alt="KhaddoKotha Hero"
        className="w-full h-auto"
      />

      {/* Get Started Button - Positioned at Bottom Right */}
      <div className="absolute bottom-8 right-8">
        <a
          href="/signup"
          className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-8 py-4 text-base font-semibold text-white shadow-xl shadow-emerald-900/30 transition hover:bg-emerald-700 hover:scale-105"
        >
          Get Started Free
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </a>
      </div>
    </section>
  );
}
