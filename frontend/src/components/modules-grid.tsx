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
      <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
            Platform Tools
          </p>
          <h2 className="mt-2 text-2xl md:text-3xl font-semibold text-slate-900">
            Explore Our Food Management Solutions
          </h2>
          <p className="mt-2 text-slate-600">
            Powerful tools to track, preserve, and optimize your food resources
          </p>
        </div>
        <span className="rounded-full bg-emerald-50 px-4 py-1 text-xs font-semibold tracking-widest text-emerald-700">
          /api/features
        </span>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-emerald-200 bg-emerald-50/60 p-8 text-center text-sm text-slate-500">
            Platform features loading... Connect your backend service to see available tools.
          </div>
        ) : (
          templates.map((template) => (
            <article
              key={template.slug}
              className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-300"
            >
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                {template.slug}
              </p>
              <h3 className="mt-3 text-xl font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
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

