import { cn } from "@/lib/utils"

type StartupHubsMarkProps = {
  className?: string
}

export function StartupHubsMark({ className }: Readonly<StartupHubsMarkProps>) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white text-xs font-bold text-black shadow-sm sm:size-9 sm:text-sm"
      >
        SS
      </span>
      <span className="text-xl font-semibold tracking-tight text-white sm:text-2xl">
        Startup Hubs
      </span>
    </span>
  )
}
