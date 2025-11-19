type Highlight = {
  title: string;
  body: string;
};

type PlatformHighlightsProps = {
  highlights: Highlight[];
};

export function PlatformHighlights({ highlights }: PlatformHighlightsProps) {
  return (
    <article className="rounded-3xl border border-white/50 bg-white/80 p-8 shadow-md backdrop-blur">
      <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
        How KhaddoKotha helps
      </h2>
      <ul className="mt-6 space-y-5 text-sm text-slate-600">
        {highlights.map((section) => (
          <li
            key={section.title}
            className="rounded-2xl border border-emerald-100/60 bg-emerald-50/80 p-5"
          >
            <p className="text-base font-semibold text-slate-900">
              {section.title}
            </p>
            <p className="mt-2">{section.body}</p>
          </li>
        ))}
      </ul>
    </article>
  );
}

