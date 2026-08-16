import { cn } from "@/lib/utils"

type TwcgMarkProps = {
  className?: string
}

export function TwcgMark({ className }: Readonly<TwcgMarkProps>) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-sm bg-gradient-to-br from-[#9d5cff] to-[#5c8dff] shadow-[0_0_20px_rgba(157,92,255,0.65)]"
      />
      <span className="text-xl font-black tracking-tight text-white sm:text-2xl">TWCG</span>
    </span>
  )
}
