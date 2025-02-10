import Link from "next/link"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

interface LogoProps {
  size?: "sm" | "md" | "lg"
  className?: string
}

export default function Logo({ size = "md", className }: LogoProps) {
  const sizeClasses = {
    sm: "text-xl",
    md: "text-2xl",
    lg: "text-4xl"
  }

  const letterSpacing = {
    sm: "px-0",
    md: "px-0",
    lg: "px-0"
  }

  return (
    <Link
      href="https://voxit.com.au"
      className={cn(
        "font-['SharpSansBold'] inline-flex items-center",
        sizeClasses[size],
        className
      )}
    >
      <div className="flex space-x-0">
        {/* V */}
        <div className="relative flex">
          <span className={cn(
            "text-white font-bold relative z-10",
            letterSpacing[size]
          )}>
            v
          </span>
        </div>

        {/* O */}
        <div className="relative flex">
          <span className={cn(
            "text-white font-bold relative z-10",
            letterSpacing[size]
          )}>
            o
          </span>
        </div>

        {/* X */}
        <div className="relative flex">
          <span className={cn(
            "text-white font-bold relative z-10",
            letterSpacing[size]
          )}>
            x
          </span>
        </div>
      </div>
    </Link>
  )
} 