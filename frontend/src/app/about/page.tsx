import { SiteHeader } from "@/components/header";
import { SiteFooter } from "@/components/footer";
import Link from "next/link";

type Developer = {
  name: string;
  role: string;
  email: string;
  avatar: string;
  description: string;
  githubUrl: string;
  linkedinUrl: string;
};

const teamMembers: Developer[] = [
  {
    name: "Nadia Rahman",
    role: "Clinical AI Strategist",
    email: "nadia@aihealthlookout.com",
    avatar:
      "https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&w=900&q=80",
    description:
      "Designs early-warning care pathways and ensures every alert is grounded in evidence-based medicine.",
    githubUrl: "https://github.com/vercel",
    linkedinUrl: "https://www.linkedin.com",
  },
  {
    name: "Harun Patel",
    role: "Data Platform Lead",
    email: "harun@aihealthlookout.com",
    avatar:
      "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=900&q=80",
    description:
      "Architect behind our Neon + streaming stack, focused on resilience, governance, and speed-to-signal.",
    githubUrl: "https://github.com/vercel",
    linkedinUrl: "https://www.linkedin.com",
  },
  {
    name: "Selene Ortiz",
    role: "Product Design Director",
    email: "selene@aihealthlookout.com",
    avatar:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80",
    description:
      "Champions explainability and trust. Leads patient interviews and translates insights into calming UI.",
    githubUrl: "https://github.com/vercel",
    linkedinUrl: "https://www.linkedin.com",
  },
  {
    name: "Caleb Njoroge",
    role: "Health Systems Partner Lead",
    email: "caleb@aihealthlookout.com",
    avatar:
      "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=900&q=80",
    description:
      "Works with hospitals and civic agencies to co-design deployments and measure impact across populations.",
    githubUrl: "https://github.com/vercel",
    linkedinUrl: "https://www.linkedin.com",
  },
];

const features = [
  {
    title: "Signal graph",
    description: "Track vitals, labs, and SDOH markers as one adaptive tapestry.",
  },
  {
    title: "Event cockpit",
    description: "Coordinate rapid responses across teams with context-aware nudges.",
  },
  {
    title: "Explainability kit",
    description: "Share plain-language rationales with clinicians and their patients.",
  },
  {
    title: "Governance guardrails",
    description: "Audit ML decisions automatically and route escalations to reviewers.",
  },
  {
    title: "Service locator",
    description: "Match high-risk patients with nearby clinics, programs, or social care.",
  },
  {
    title: "Community loops",
    description: "Invite caregivers and families into the monitoring journey securely.",
  },
];

function DeveloperCard({
  name,
  role,
  email,
  avatar,
  description,
  githubUrl,
  linkedinUrl,
}: Developer) {
  return (
    <div className="group overflow-hidden rounded-3xl border border-white/40 bg-slate-900 text-white shadow-2xl">
      <div
        className="relative h-52 w-full overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(to top, rgba(15,23,42,0.8), rgba(15,23,42,0.2)), url(${avatar})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      />
      <div className="flex flex-col gap-3 px-6 pb-6 pt-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            {role}
          </p>
          <h3 className="mt-2 text-2xl font-semibold">{name}</h3>
        </div>
        <p className="text-sm text-slate-200">{description}</p>
        <div className="flex items-center justify-between pt-4">
          <a
            href={`mailto:${email}`}
            className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-slate-900 transition hover:bg-emerald-100"
          >
            Email
          </a>
          <div className="flex gap-3 text-slate-300">
            <a
              href={githubUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              GitHub
            </a>
            <a
              href={linkedinUrl}
              target="_blank"
              rel="noreferrer"
              className="hover:text-white"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[#BCEBD7] text-slate-900">
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-6 py-10">
        <SiteHeader />

        <main className="mt-10 flex flex-1 flex-col gap-16">
          <section className="text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">
              About AI-health Lookout
            </p>
            <h1 className="mt-4 text-4xl font-semibold md:text-5xl">
              Calm AI infrastructure for population health.
            </h1>
            <p className="mx-auto mt-4 max-w-3xl text-lg text-slate-600">
              Our mission is to give clinicians and civic responders an always-on
              sentinel that spots anomalies, briefs the right people, and keeps
              communities healthier through timely action.
            </p>
          </section>

          <section className="grid gap-8 md:grid-cols-2">
            <article
              className="overflow-hidden rounded-3xl border border-white/60 bg-white/80 shadow-lg"
              style={{
                backgroundImage:
                  "linear-gradient(to top, rgba(8,47,35,0.2), rgba(8,47,35,0.2)), url(https://images.unsplash.com/photo-1521790361543-f645cf042ec4?auto=format&fit=crop&w=1400&q=80)",
                backgroundSize: "cover",
                backgroundPosition: "center",
              }}
            >
              <div className="h-96 w-full" />
            </article>

            <div className="grid grid-rows-3 gap-4">
              {[
                {
                  title: "Mission",
                  body: "Proactive intelligence that helps clinicians intervene before a patient feels a symptom.",
                },
                {
                  title: "Vision",
                  body: "Every community has a trustworthy AI copilot watching over vitals, environmental data, and access to care.",
                },
                {
                  title: "Values",
                  body: "Transparency, safety, patient dignity, and co-creation with frontline teams.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border border-emerald-100/70 bg-emerald-50/80 p-5 shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="h-10 w-10 rounded-full bg-slate-900/80 text-center text-lg font-semibold text-[#BCEBD7]">
                      {item.title.charAt(0)}
                    </span>
                    <h3 className="text-lg font-semibold">{item.title}</h3>
                  </div>
                  <p className="mt-3 text-sm text-slate-600">{item.body}</p>
                </article>
              ))}
            </div>
          </section>

          <section className="text-center">
            <h2 className="text-3xl font-semibold">Our Team</h2>
            <p className="mt-3 text-slate-600">
              People building pragmatic AI so civic and clinical teams stay ahead
              of risk.
            </p>
            <div className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {teamMembers.map((member) => (
                <DeveloperCard key={member.email} {...member} />
              ))}
            </div>
          </section>

          <section>
            <h2 className="text-center text-3xl font-semibold">What we deliver</h2>
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-sm"
                >
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-slate-600">
                    {feature.description}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-slate-900/10 bg-slate-900 text-[#BCEBD7] p-10 text-center shadow-xl">
            <h2 className="text-3xl font-semibold">Join our next pilot</h2>
            <p className="mx-auto mt-3 max-w-2xl text-base text-[#DFF3E7]">
              Partner with AI-health Lookout to monitor high-risk populations,
              evaluate interventions faster, and keep leadership briefed with
              humane reporting.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm font-semibold">
              <a
                href="mailto:hello@aihealthlookout.com"
                className="rounded-full bg-white px-6 py-3 text-slate-900 transition hover:bg-emerald-50"
              >
                Contact us
              </a>
              <Link
                href="/"
                className="rounded-full border border-[#BCEBD7]/70 px-6 py-3 text-[#BCEBD7] transition hover:bg-[#BCEBD7]/10"
              >
                Download overview
              </Link>
            </div>
          </section>
        </main>

        <SiteFooter />
      </div>
    </div>
  );
}

