'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import confetti, { Shape } from 'canvas-confetti'

const canvasStyles = {
  position: 'fixed',
  pointerEvents: 'none',
  width: '100%',
  height: '100%',
  top: 0,
  left: 0
}

export default function LovesPage() {
  const [makeShot, setMakeShot] = useState<((options: { spread: number, startVelocity: number, particleCount: number, origin: { y: number } }) => void) | null>(null)
  const [showText, setShowText] = useState(false)

  useEffect(() => {
    // Show text after a small delay
    const textTimer = setTimeout(() => {
      setShowText(true)
    }, 500)

    return () => clearTimeout(textTimer)
  }, [])

  useEffect(() => {
    // Trigger fireworks when text appears
    if (showText) {
      const interval = setInterval(() => {
        triggerFireworks();
      }, 650)

      // Stop fireworks after 4 seconds
      const stopTimer = setTimeout(() => {
        clearInterval(interval)
      }, 4000)

      return () => {
        clearInterval(interval)
        clearTimeout(stopTimer)
      }
    }
  }, [showText, makeShot])

  const getInstance = (instance: any) => {
    if (instance) {
      setMakeShot(() => instance({
        spread: 90,
        startVelocity: 30,
        particleCount: 100,
        origin: { y: 0.6 }
      }))
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-black relative overflow-hidden">
      
      
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={showText ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="text-9xl font-bold text-white font-semibold font-light tracking-wider"
      >
        KATE
      </motion.div>
    </div>
  )
}
const triggerFireworks = () => {
    const duration = 1000;
    const animationEnd = Date.now() + duration
    const defaults = { 
      colors: ['#ff0000', '#ff3333', '#ff4444', '#ff6666'],
      shapes: ['circle'] as Shape[],
      ticks: 20,
      zIndex: 0,
      disableForReducedMotion: true
    }
  
    const interval: NodeJS.Timeout = setInterval(() => {
      const timeLeft = animationEnd - Date.now()
      if (timeLeft <= 0) return clearInterval(interval)
  
      const progress = 1 - (timeLeft / duration)
      const intensity = Math.min(1, progress * 2)
      
      // Launch fireworks from three positions
      const positions = [0.2, 0.5, 0.8]
      positions.forEach(xPos => {
        confetti({
          ...defaults,
          origin: { x: xPos, y: 1 },
          particleCount: Math.floor(30 + (100 * intensity)),
          spread: 360 * intensity,
          scalar: 1 + intensity,
          gravity: 1.2,
          decay: 0.95,
        })
      })
    }, 100)
  
    // Final burst
    setTimeout(() => {
      Array.from({ length: 5 }).forEach(() => {
        confetti({
          ...defaults,
          origin: { 
            x: 0.2 + Math.random() * 0.6, 
            y: 0.2 + Math.random() * 0.6 
          },
          particleCount: 150,
          spread: 360,
          gravity: 1,
          ticks: 300,
          scalar: 2
        })
      })
    }, duration - 500)
  }
  