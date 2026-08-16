import { cn } from "@/lib/utils"

type TwineTrackMarkProps = {
  className?: string
}

export function TwineTrackMark({ className }: Readonly<TwineTrackMarkProps>) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="size-2.5 shrink-0 rounded-full bg-gradient-to-br from-[#2f8f63] to-[#1f5c42] shadow-[0_0_20px_rgba(47,143,99,0.65)]"
      />
      <span className="text-xl font-black tracking-tight text-white sm:text-2xl">Twine Track</span>
    </span>
  )
}
