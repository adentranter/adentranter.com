import Image from "next/image"
import { cn } from "@/lib/utils"

type MailYourMpMarkProps = {
  className?: string
}

export function MailYourMpMark({ className }: Readonly<MailYourMpMarkProps>) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <Image
        src="/logos/mail-your-mp.svg"
        alt=""
        width={48}
        height={48}
        className="size-11 shrink-0 rounded-[18%] shadow-sm sm:size-12"
        unoptimized
      />
      <span className="text-xl font-bold tracking-tight text-white sm:text-2xl">
        Mail Your MP
      </span>
    </span>
  )
}
