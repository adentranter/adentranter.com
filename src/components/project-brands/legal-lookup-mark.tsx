import { cn } from "@/lib/utils"

type LegalLookupMarkProps = {
  className?: string
}

export function LegalLookupMark({ className }: Readonly<LegalLookupMarkProps>) {
  return (
    <span
      className={cn(
        "inline-block font-mono text-sm font-medium uppercase tracking-[0.18em] text-white/90 sm:text-base",
        className
      )}
    >
      Legal Lookup
    </span>
  )
}
