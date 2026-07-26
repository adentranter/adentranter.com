import { cn } from "@/lib/utils"

type FounderConfigMarkProps = {
  className?: string
}

export function FounderConfigMark({ className }: Readonly<FounderConfigMarkProps>) {
  return (
    <span
      className={cn(
        "font-[family-name:var(--font-fraunces)] text-3xl tracking-tight text-white sm:text-4xl",
        className
      )}
    >
      Founder Config
    </span>
  )
}
