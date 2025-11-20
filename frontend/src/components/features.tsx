type Feature = {
    icon: string;
    title: string;
    description: string;
};

type FeaturesProps = {
    features: Feature[];
};

export function FeaturesSection({ features }: FeaturesProps) {
    return (
        <section id="features" className="rounded-3xl border border-white/60 bg-white/90 p-10 shadow-lg">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    Everything You Need to Manage Food Smartly
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Comprehensive tools to track, analyze, and optimize your food consumption
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className="group rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-emerald-300"
                    >
                        <div
                            className="w-12 h-12 text-emerald-600 mb-4"
                            dangerouslySetInnerHTML={{ __html: feature.icon }}
                        />
                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                            {feature.title}
                        </h3>
                        <p className="text-sm text-slate-600 leading-relaxed">
                            {feature.description}
                        </p>
                    </div>
                ))}
            </div>
        </section>
    );
}
