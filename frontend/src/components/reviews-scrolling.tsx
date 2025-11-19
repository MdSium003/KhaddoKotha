"use client";

import { useEffect, useRef } from "react";

const reviews = [
    {
        id: 1,
        author: "Sarah M.",
        role: "Home Cook",
        content: "KhaddoKotha has completely transformed how I find recipes. The local focus is amazing!",
        avatar: "S",
    },
    {
        id: 2,
        author: "Rahim U.",
        role: "Foodie",
        content: "I love sharing my grandmother's traditional recipes here. The community is so welcoming.",
        avatar: "R",
    },
    {
        id: 3,
        author: "Emily J.",
        role: "Chef",
        content: "A great platform to discover hidden culinary gems in the city. Highly recommended!",
        avatar: "E",
    },
    {
        id: 4,
        author: "Tanvir H.",
        role: "Student",
        content: "Quick and easy recipes for my busy schedule. The 'Fresh Ingredients' feature is a lifesaver.",
        avatar: "T",
    },
    {
        id: 5,
        author: "Nadia K.",
        role: "Baker",
        content: "The best place to find inspiration for my weekend baking projects.",
        avatar: "N",
    },
];

export function ReviewsSection() {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const el = scrollRef.current;
        if (!el) return;

        let animationFrameId: number;
        let scrollPos = 0;

        const scroll = () => {
            scrollPos += 0.5;
            if (scrollPos >= el.scrollWidth / 2) {
                scrollPos = 0;
            }
            el.scrollLeft = scrollPos;
            animationFrameId = requestAnimationFrame(scroll);
        };

        animationFrameId = requestAnimationFrame(scroll);

        return () => cancelAnimationFrame(animationFrameId);
    }, []);

    return (
        <section className="w-full overflow-hidden py-12">
            <div className="mb-8 text-center">
                <h2 className="text-2xl font-bold text-slate-900">What our community says</h2>
                <p className="text-slate-600">Stories from kitchens across the city</p>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-hidden whitespace-nowrap px-4"
                style={{ width: "100%" }}
            >
                {[...reviews, ...reviews].map((review, idx) => (
                    <div
                        key={`${review.id}-${idx}`}
                        className="inline-block w-80 flex-none rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
                    >
                        <p className="whitespace-normal text-sm text-slate-600 italic">"{review.content}"</p>
                        <div className="mt-4 flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 font-bold">
                                {review.avatar}
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{review.author}</p>
                                <p className="text-xs text-slate-500">{review.role}</p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
