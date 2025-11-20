const testimonials = [
    {
        name: "Sumaiya Akhter",
        role: "Working Mother",
        image: "👩‍💼",
        quote: "KhaddoKotha helped our family reduce food waste by 40% in just 2 months. The inventory tracking is a game-changer!",
        savings: "$3,500/month saved"
    },
    {
        name: "Rahat Das Anabil",
        role: "Restaurant Owner",
        image: "👨‍🍳",
        quote: "The expiration tracking feature alone has saved my restaurant thousands. This platform is essential for any food business.",
        savings: "30% waste reduction"
    },
    {
        name: "Rafsan Jani",
        role: "College Student",
        image: "👩‍🎓",
        quote: "As a student on a budget, this app helps me plan meals and never waste groceries. The educational resources are super helpful!",
        savings: "$1,200/month saved"
    }
];

export function TestimonialsSection() {
    return (
        <section className="rounded-3xl border border-white/60 bg-white/90 p-10 shadow-lg">
            <div className="text-center mb-12">
                <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                    Real People, Real Impact
                </h2>
                <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                    Join thousands who are already saving money and reducing waste
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {testimonials.map((testimonial, index) => (
                    <div
                        key={index}
                        className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className="text-5xl">{testimonial.image}</div>
                            <div>
                                <h4 className="font-semibold text-slate-900">{testimonial.name}</h4>
                                <p className="text-sm text-slate-600">{testimonial.role}</p>
                            </div>
                        </div>
                        <p className="text-slate-700 italic mb-4">"{testimonial.quote}"</p>
                        <div className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-sm font-semibold">
                            {testimonial.savings}
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-12 text-center">
                <p className="text-slate-600 mb-4">Trusted by families and businesses across India</p>
                <div className="flex justify-center items-center gap-8 flex-wrap">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">5,000+</div>
                        <div className="text-sm text-slate-600">Active Users</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">$10L+</div>
                        <div className="text-sm text-slate-600">Money Saved</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">2M+</div>
                        <div className="text-sm text-slate-600">Items Tracked</div>
                    </div>
                </div>
            </div>
        </section>
    );
}
