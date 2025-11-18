"use client"

import FlipCounter from "@/components/toowicked/flip-counter"

export default function TooWickedPage() {
  // GMT+10 6pm Friday 21st November 2025
  // Create date in GMT+10 timezone
  const targetDate = new Date("2025-11-21T18:00:00+10:00")

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-950 via-pink-900 via-green-900 to-green-950 p-4 sm:p-6 md:p-8 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-pink-500 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 sm:w-96 sm:h-96 bg-green-500 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
      </div>
      
      <div className="text-center space-y-8 sm:space-y-10 md:space-y-12 relative z-10 w-full max-w-7xl">
        <h1 className="text-5xl sm:text-6xl md:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-pink-400 to-green-300 mb-4 sm:mb-6 md:mb-8 drop-shadow-2xl px-4">
          WICKED 2
        </h1>
        <FlipCounter targetDate={targetDate} />
      </div>
    </div>
  )
}

