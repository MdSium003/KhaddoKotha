export function CTASection() {
    return (
        <section className="rounded-3xl border border-emerald-200 bg-gradient-to-br from-emerald-600 to-green-700 p-12 shadow-xl text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                Ready to Reduce Food Waste?
            </h2>
            <p className="text-xl text-emerald-50 max-w-2xl mx-auto mb-8">
                Join thousands of users already saving money and helping the planet. Start your free account today—no credit card required.
            </p>

            <div className="flex flex-wrap gap-4 justify-center items-center mb-8">
                <a
                    href="/signup"
                    className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-4 text-base font-semibold text-emerald-700 shadow-lg transition hover:bg-emerald-50"
                >
                    Create Free Account
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                </a>
                <a
                    href="/food-preservative"
                    className="inline-flex items-center gap-2 rounded-full border-2 border-white bg-transparent px-8 py-4 text-base font-semibold text-white transition hover:bg-white/10"
                >
                    Explore Features
                </a>
            </div>

            <div className="flex flex-wrap justify-center gap-8 text-white/90 text-sm">
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Free Forever</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>No Credit Card</span>
                </div>
                <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>Setup in 5 Minutes</span>
                </div>
            </div>
        </section>
    );
}
