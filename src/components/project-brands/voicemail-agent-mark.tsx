import { cn } from "@/lib/utils"

type VoicemailAgentMarkProps = {
  className?: string
}

export function VoicemailAgentMark({ className }: Readonly<VoicemailAgentMarkProps>) {
  return (
    <span
      className={cn(
        "text-xl font-medium tracking-tight text-white sm:text-2xl",
        className
      )}
    >
      voicemail <span className="text-white/40">·</span> agent
    </span>
  )
}
