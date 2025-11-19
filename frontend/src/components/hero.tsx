type HeroProps = {
  mission: string;
};

export function HeroSection({ mission }: HeroProps) {
  return (
    <section
      id="mission"
      className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/50 to-white p-10 shadow-xl shadow-emerald-100/50"
    >
      <p className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-600">
        Taste the difference
      </p>
      <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 md:text-6xl">
        Discover & Share <br />
        <span className="text-emerald-500">Authentic Recipes</span>
      </h1>
      <p className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-600">{mission}</p>
      <div className="mt-8 flex flex-wrap gap-4 text-sm font-medium">
        <button className="rounded-full bg-emerald-600 px-6 py-3 text-white shadow-lg shadow-emerald-200 transition hover:bg-emerald-700 hover:shadow-emerald-300">
          Explore Recipes
        </button>
        <button className="rounded-full border border-slate-200 bg-white px-6 py-3 text-slate-700 transition hover:bg-slate-50 hover:border-slate-300">
          Share Your Story
        </button>
      </div>
    </section>
  );
}

