type SystemStatusCardProps = {
  ok: boolean;
  databaseVersion?: string;
};

export function SystemStatusCard({
  ok,
  databaseVersion,
}: SystemStatusCardProps) {
  return (
    <article className="rounded-3xl border border-emerald-200/80 bg-white/80 p-8 shadow-md">
      <p className="text-sm font-semibold text-emerald-600">
        Live system health
      </p>
      <p className="mt-3 text-3xl font-semibold text-slate-900">
        {ok ? "Neon link stable" : "Backend offline"}
      </p>
      <p className="mt-2 text-sm text-slate-500">
        {ok
          ? `Running on ${databaseVersion}`
          : "Start the backend service to re-establish monitoring."}
      </p>
      <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50/80 p-6 text-xs uppercase tracking-widest text-slate-500">
        Endpoint: /api/health
      </div>
    </article>
  );
}

