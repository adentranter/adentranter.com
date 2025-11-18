"use client"

import { useEffect, useState } from "react"

interface FlipCounterProps {
  targetDate: Date
}

interface TimeLeft {
  days: number
  hours: number
  minutes: number
  seconds: number
}

function FlipDigit({ value, label }: { value: number; label: string }) {
  const [displayValue, setDisplayValue] = useState(value)
  const [isFlipping, setIsFlipping] = useState(false)
  const [previousValue, setPreviousValue] = useState(value)

  useEffect(() => {
    if (displayValue !== value) {
      setPreviousValue(displayValue)
      setIsFlipping(true)
      const timer = setTimeout(() => {
        setDisplayValue(value)
        setIsFlipping(false)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [value, displayValue])

  const formattedValue = displayValue.toString().padStart(2, "0")
  const formattedPrevious = previousValue.toString().padStart(2, "0")

  return (
    <div className="flex flex-col items-center gap-2 sm:gap-3 md:gap-4">
      <div className="relative">
        {/* Card container with shadow */}
        <div className="relative w-20 h-28 sm:w-24 sm:h-32 md:w-32 md:h-44 perspective-1000">
          {/* Static bottom half - Green (always visible) */}
          <div
            className="absolute bottom-0 left-0 right-0 h-1/2 bg-gradient-to-b from-green-500 via-green-600 to-green-700 rounded-b-lg sm:rounded-b-xl border-2 border-green-300 flex items-start justify-center pt-2 sm:pt-3 overflow-hidden"
            style={{
              boxShadow: "inset 0 2px 10px rgba(0,0,0,0.3)",
              zIndex: 1,
            }}
          >
            <span className="text-4xl sm:text-5xl md:text-7xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
              {formattedValue}
            </span>
          </div>

          {/* Flipping top half - Pink card with number on back */}
          <div
            className={`absolute top-0 left-0 right-0 h-1/2 rounded-t-lg sm:rounded-t-xl border-2 border-pink-300 overflow-hidden ${
              isFlipping ? "flip-card-top" : ""
            }`}
            style={{
              transformStyle: "preserve-3d",
              transformOrigin: "bottom",
              zIndex: 3,
            }}
          >
            {/* Front face - blank pink */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-pink-500 via-pink-600 to-pink-700"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateX(0deg)",
                boxShadow: "inset 0 -2px 10px rgba(0,0,0,0.3)",
              }}
            />
            
            {/* Back face - pink with number (previous value) */}
            <div
              className="absolute inset-0 bg-gradient-to-b from-pink-500 via-pink-600 to-pink-700 flex items-end justify-center pb-2 sm:pb-3"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateX(180deg)",
                boxShadow: "inset 0 -2px 10px rgba(0,0,0,0.3)",
              }}
            >
              <span className="text-4xl sm:text-5xl md:text-7xl font-black text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                {formattedPrevious}
              </span>
            </div>
          </div>

          {/* Divider line */}
          <div className="absolute top-1/2 left-0 right-0 h-0.5 sm:h-1 bg-black/50 z-20 shadow-lg" />
          {/* Side borders for depth */}
          <div className="absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 bg-black/30 rounded-l-lg sm:rounded-l-xl z-10" />
          <div className="absolute right-0 top-0 bottom-0 w-0.5 sm:w-1 bg-black/30 rounded-r-lg sm:rounded-r-xl z-10" />
        </div>
      </div>
      <span className="text-sm sm:text-base md:text-xl font-bold text-pink-200 uppercase tracking-wider drop-shadow-lg">
        {label}
      </span>
    </div>
  )
}

export default function FlipCounter({ targetDate }: FlipCounterProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  })

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date()
      const difference = targetDate.getTime() - now.getTime()

      if (difference <= 0) {
        return { days: 0, hours: 0, minutes: 0, seconds: 0 }
      }

      return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      }
    }

    setTimeLeft(calculateTimeLeft())

    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft())
    }, 1000)

    return () => clearInterval(interval)
  }, [targetDate])

  return (
    <div className="flex flex-wrap justify-center items-center gap-3 sm:gap-4 md:gap-6 lg:gap-8 px-2">
      <FlipDigit value={timeLeft.days} label="Days" />
      <FlipDigit value={timeLeft.hours} label="Hours" />
      <FlipDigit value={timeLeft.minutes} label="Minutes" />
      <FlipDigit value={timeLeft.seconds} label="Seconds" />
    </div>
  )
}

