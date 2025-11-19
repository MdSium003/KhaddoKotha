type TemplateItem = {
  title: string;
  description: string;
  slug: string;
};

type ModulesGridProps = {
  templates: TemplateItem[];
};

export function ModulesGrid({ templates }: ModulesGridProps) {
  return (
    <section
      id="modules"
      className="rounded-3xl border border-white/60 bg-white/80 p-8 shadow-lg"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-emerald-600">
            Monitoring modules
          </p>
          <h2 className="mt-2 text-2xl font-semibold text-slate-900">
            Built on Neon for speed and safety.
          </h2>
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold tracking-widest text-emerald-700">
          /api/templates
        </span>
      </div>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center text-sm text-slate-500">
            Power up the backend service to pull prototype modules from NeonDB.
          </div>
        ) : (
          templates.map((template) => (
            <article
              key={template.slug}
              className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-400">
                {template.slug}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900">
                {template.title}
              </h3>
              <p className="mt-2 text-sm text-slate-600">
                {template.description}
              </p>
            </article>
          ))
        )}
      </div>
    </section>
  );
}

