"use client"

import { useEffect, useRef } from "react"

const LAG = 0.08
const MAX_SPEED_SCALE = 1.2
const IDLE_WANDER_DELAY = 2200
const INITIAL_POSITION_FACTOR = { x: 0.6, y: 0.4 }

function attachMediaQueryListener(mediaQuery: MediaQueryList, handler: () => void) {
  if (typeof mediaQuery.addEventListener === "function") {
    const listener = () => handler()
    mediaQuery.addEventListener("change", listener)
    return () => mediaQuery.removeEventListener("change", listener)
  }

  const legacyListener = () => handler()
  mediaQuery.addListener(legacyListener)
  return () => mediaQuery.removeListener(legacyListener)
}

export default function FireflyCursor() {
  const fireflyRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === "undefined") {
      return
    }

    const firefly = fireflyRef.current
    if (!firefly) {
      return
    }

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)")
    const hasCoarsePointer = window.matchMedia("(pointer: coarse)")

    if (prefersReducedMotion.matches || hasCoarsePointer.matches) {
      firefly.style.display = "none"
      return
    }

    const position = {
      x: window.innerWidth * INITIAL_POSITION_FACTOR.x,
      y: window.innerHeight * INITIAL_POSITION_FACTOR.y,
    }
    const target = { ...position }
    const lastMove = { time: performance.now() }

    let rafId: number | null = null

    const updateFirefly = (time: number) => {
      const idle = time - lastMove.time > IDLE_WANDER_DELAY
      const wanderT = time / 1600
      const wanderStrength = idle ? 6 : 1.5

      const desiredX = target.x + Math.cos(wanderT) * wanderStrength
      const desiredY = target.y + Math.sin(wanderT * 1.2) * (wanderStrength * 0.7)

      position.x += (desiredX - position.x) * LAG
      position.y += (desiredY - position.y) * LAG

      const dx = target.x - position.x
      const dy = target.y - position.y
      const velocity = Math.hypot(dx, dy)
      const speedFactor = Math.min(velocity / 160, MAX_SPEED_SCALE)
      const flicker = 0.9 + Math.sin(time / 380) * 0.06

      const scale = 0.3 + speedFactor * 0.04
      const opacity = Math.min(0.2, 0.09 + speedFactor * 0.06)
      const blur = 6 + speedFactor * 3

      firefly.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%) scale(${scale.toFixed(3)})`
      firefly.style.opacity = (opacity * flicker).toFixed(3)
      firefly.style.filter = `blur(${(blur * flicker).toFixed(1)}px)`

      rafId = requestAnimationFrame(updateFirefly)
    }

    const handlePointerMove = (event: MouseEvent) => {
      target.x = event.clientX
      target.y = event.clientY
      lastMove.time = performance.now()

      if (!rafId) {
        rafId = requestAnimationFrame(updateFirefly)
      }
    }

    firefly.style.opacity = "0"
    firefly.style.transform = `translate3d(${position.x}px, ${position.y}px, 0) translate(-50%, -50%)`
    rafId = requestAnimationFrame(updateFirefly)

    window.addEventListener("mousemove", handlePointerMove)

    const handleResize = () => {
      position.x = Math.min(position.x, window.innerWidth - 32)
      position.y = Math.min(position.y, window.innerHeight - 32)
      target.x = Math.min(target.x, window.innerWidth - 32)
      target.y = Math.min(target.y, window.innerHeight - 32)
    }

    window.addEventListener("resize", handleResize)

    const handleVisibility = () => {
      if (document.hidden) {
        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        firefly.style.opacity = "0"
      } else if (!rafId) {
        rafId = requestAnimationFrame(updateFirefly)
      }
    }

    document.addEventListener("visibilitychange", handleVisibility)

    const handleMotionChange = () => {
      if (prefersReducedMotion.matches || hasCoarsePointer.matches) {
        firefly.style.display = "none"
        if (rafId) {
          cancelAnimationFrame(rafId)
          rafId = null
        }
        window.removeEventListener("mousemove", handlePointerMove)
      } else {
        firefly.style.display = "block"
        window.addEventListener("mousemove", handlePointerMove)
        if (!rafId) {
          rafId = requestAnimationFrame(updateFirefly)
        }
      }
    }

    const detachReducedMotion = attachMediaQueryListener(prefersReducedMotion, handleMotionChange)
    const detachPointer = attachMediaQueryListener(hasCoarsePointer, handleMotionChange)

    return () => {
      if (rafId) {
        cancelAnimationFrame(rafId)
      }
      window.removeEventListener("mousemove", handlePointerMove)
      window.removeEventListener("resize", handleResize)
      document.removeEventListener("visibilitychange", handleVisibility)
      detachReducedMotion()
      detachPointer()
    }
  }, [])

  return (
    <div
      ref={fireflyRef}
      className="pointer-events-none fixed left-0 top-0 z-30 h-5 w-5 opacity-0"
      aria-hidden="true"
    >
      <div className="absolute inset-0 rounded-full bg-amber-200 opacity-40 blur-[13px]" />
      <div className="absolute inset-[3px] rounded-full bg-amber-100 opacity-30 blur-md" />
      <div className="absolute inset-[6px] rounded-full bg-amber-50 opacity-40 shadow-[0_0_9px_rgba(255,235,185,0.45)]" />
    </div>
  )
}
