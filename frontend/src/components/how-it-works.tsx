type Step = {
    step: string;
    title: string;
    description: string;
};

type HowItWorksProps = {
    steps: Step[];
};

export function HowItWorksSection({ steps }: HowItWorksProps) {
    return (
        <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-white p-10 shadow-lg">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    How It Works
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Get started in minutes and start reducing food waste today
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                {steps.map((stepItem, index) => (
                    <div key={index} className="relative">
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 rounded-full bg-emerald-600 text-white flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-emerald-200">
                                {stepItem.step}
                            </div>
                            <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                {stepItem.title}
                            </h3>
                            <p className="text-sm text-slate-600 leading-relaxed">
                                {stepItem.description}
                            </p>
                        </div>
                        {index < steps.length - 1 && (
                            <div className="hidden lg:block absolute top-8 left-[60%] w-[80%] h-0.5 bg-gradient-to-r from-emerald-300 to-transparent"></div>
                        )}
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <a
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-base font-semibold text-white shadow-lg transition hover:bg-slate-800"
                >
                    Start Your Journey
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </a>
            </div>
        </section>
    );
}
