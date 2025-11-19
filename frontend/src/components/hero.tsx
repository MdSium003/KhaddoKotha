type HeroProps = {
  mission: string;
};

export function HeroSection({ mission }: HeroProps) {
  return (
    <section
      id="mission"
      className="rounded-3xl border border-white/40 bg-gradient-to-br from-white/90 to-emerald-100/80 p-10 shadow-xl shadow-emerald-200/50"
    >
      <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">
        Digital sentinel
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight md:text-5xl">
        Real-time AI surveillance for population health teams.
      </h1>
      <p className="mt-4 max-w-3xl text-lg text-slate-600">{mission}</p>
      <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
        <button className="rounded-full bg-slate-900 px-5 py-2.5 text-[#BCEBD7]">
          Launch pilot
        </button>
        <button className="rounded-full border border-slate-900/20 bg-white px-5 py-2.5 text-slate-900">
          Download overview
        </button>
        <a
          href="/inventory"
          className="rounded-full bg-emerald-600 px-5 py-2.5 text-white hover:bg-emerald-700 transition-colors"
        >
          General Inventory
        </a>
      </div>
    </section>
  );
}

