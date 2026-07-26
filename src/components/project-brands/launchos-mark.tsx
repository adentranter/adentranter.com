import { cn } from "@/lib/utils"

type LaunchOsMarkProps = {
  className?: string
}

export function LaunchOsMark({ className }: Readonly<LaunchOsMarkProps>) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full bg-gradient-to-br from-[#0f9f6e] to-[#0b8fb8] shadow-[0_0_20px_rgba(73,230,161,0.65)]"
      />
      <span className="text-xl font-black tracking-tight text-white sm:text-2xl">LaunchOS</span>
    </span>
  )
}
