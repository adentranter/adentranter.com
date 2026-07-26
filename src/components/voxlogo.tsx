import Link from "next/link"
import { cn } from "@/lib/utils"

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
  showBars?: boolean
  /** Render as a non-link mark (e.g. already wrapped in a link). */
  asMark?: boolean
}

export default function Logo({
  size = "md",
  className,
  showBars = true,
  asMark = false,
}: Readonly<LogoProps>) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl",
  }

  const letterSpacing = {
    sm: "px-1",
    md: "px-1.5",
    lg: "px-2",
  }

  const barSizes = {
    sm: "h-1",
    md: "h-1.5",
    lg: "h-2",
  }

  const markClass = cn(
    "font-['SharpSansBold'] inline-flex w-fit flex-col items-center",
    sizeClasses[size],
    className
  )

  const letters = (
    <>
      <div className="flex space-x-0">
        {(["v", "o", "x"] as const).map((letter) => (
          <div key={letter} className="relative flex">
            <span className={cn("relative z-10 text-white font-bold", letterSpacing[size])}>
              {letter}
            </span>
          </div>
        ))}
      </div>
      {showBars ? (
        <div className={cn("mt-1 flex w-full", barSizes[size])}>
          <div className="flex-1 bg-[#1B2A4A]" />
          <div className="flex-1 bg-[#8B1C2C]" />
          <div className="flex-1 bg-[#1B4B3C]" />
        </div>
      ) : null}
    </>
  )

  if (asMark) {
    return <div className={markClass}>{letters}</div>
  }

  return (
    <Link href="https://voxit.com.au" className={markClass}>
      {letters}
    </Link>
  )
}
