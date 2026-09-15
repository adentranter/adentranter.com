import { cn } from "@/lib/utils"

type LoopDeckMarkProps = {
  className?: string
}

export function LoopDeckMark({ className }: Readonly<LoopDeckMarkProps>) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full bg-gradient-to-br from-[#7dff9a] to-[#22c55e] shadow-[0_0_20px_rgba(74,222,128,0.65)]"
      />
      <span className="text-xl font-black tracking-tight text-white sm:text-2xl">LoopDeck</span>
    </span>
  )
}
