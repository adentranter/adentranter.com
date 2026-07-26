import type { ReactNode } from "react"
import Link from "next/link"
import { cn } from "@/lib/utils"

type ProjectBrandRowProps = {
  href: string
  hostname: string
  mark: ReactNode
  byline: string
  audience: string
  cardClassName: string
}

export function ProjectBrandRow({
  href,
  hostname,
  mark,
  byline,
  audience,
  cardClassName,
}: Readonly<ProjectBrandRowProps>) {
  return (
    <li>
      <Link
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={cn(
          "group grid overflow-hidden rounded-xl border transition-[border-color,transform] hover:border-white/30 md:grid-cols-2",
          cardClassName
        )}
      >
        <div className="flex flex-col items-start justify-center gap-3 p-6 text-left sm:p-8">
          <div className="min-w-0">{mark}</div>
          <p className="max-w-sm text-base font-medium tracking-tight text-white/90 sm:text-lg">
            {byline}
          </p>
          <span className="text-sm text-white/45 transition-colors group-hover:text-white/70">
            {hostname}
          </span>
        </div>

        <div className="flex flex-col justify-center gap-4 border-t border-white/10 p-6 text-left sm:p-8 md:border-t-0 md:border-l">
          <div className="space-y-1.5">
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-white/40">
              Intended audience
            </p>
            <p className="text-sm leading-relaxed text-white/60">{audience}</p>
          </div>
          <span className="text-sm text-primary/80 transition-colors group-hover:text-accent-secondary">
            Visit site →
          </span>
        </div>
      </Link>
    </li>
  )
}
