import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t border-slate-300/60 pt-6 text-sm text-slate-600">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} AI-health Lookout. All rights reserved.</p>
        <div className="flex gap-4">
          <Link className="hover:text-slate-900" href="/#mission">
            About
          </Link>
          <Link className="hover:text-slate-900" href="/#platform">
            Platform
          </Link>
          <Link className="hover:text-slate-900" href="/#modules">
            Modules
          </Link>
        </div>
      </div>
    </footer>
  );
}

