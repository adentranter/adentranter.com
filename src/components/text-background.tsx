'use client'

import { useEffect, useRef, useState, useMemo } from 'react'
import { essays } from '@/app/essays/data'

interface WordData {
  word: string
  frequency: number
  opacity: number
  x: number
  y: number
  size: number
}

export function TextBackground() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 })
  const [mouseVelocity, setMouseVelocity] = useState(0)
  const [blur, setBlur] = useState(0)
  const lastMousePosRef = useRef({ x: 0, y: 0 })
  const frameRef = useRef<number | null>(null)

  // Extract and process all essay text with caching
  const processedWords = useMemo(() => {
    // Extract all text from essays
    const allText = Object.values(essays)
      .map(({ title, excerpt }) => `${title} ${excerpt ?? ''}`)
      .join(' ')
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ') // Remove punctuation
      .replace(/\s+/g, ' ') // Normalize whitespace
      .trim()

    // Count word frequencies
    const words = allText.split(' ').filter(word => word.length > 2) // Skip short words
    const wordCount = new Map<string, number>()
    
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1)
    })

    // Convert to array and sort by frequency
    const wordArray = Array.from(wordCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 400) // Reduce to 400 words for better spacing

    // Calculate opacity based on frequency (inverse relationship)
    const maxFreq = Math.max(...wordArray.map(([, freq]) => freq))
    const minFreq = Math.min(...wordArray.map(([, freq]) => freq))

    return wordArray.map(([word, frequency], index) => {
      // More frequent words get lower opacity (0.06 to 0.18)
      const normalizedFreq = (frequency - minFreq) / (maxFreq - minFreq)
      const opacity = 0.18 - (normalizedFreq * 0.12)
      
      // More frequent words get bigger sizes (0.8 to 1.4rem)
      const size = 0.8 + (normalizedFreq * 0.6)
      
      return {
        word,
        frequency,
        opacity,
        x: (index * 137 + word.length * 29) % 100, // Better spread with word length
        y: (index * 71 + word.charCodeAt(0) * 13) % 100, // Use first char for Y variation
        size
      }
    })
  }, []) // Empty dependency array since essays data is static

  // Handle mouse movement and blur calculation
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return

      const rect = containerRef.current.getBoundingClientRect()
      const newPos = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      }

      // Calculate velocity
      const dx = newPos.x - lastMousePosRef.current.x
      const dy = newPos.y - lastMousePosRef.current.y
      const distance = Math.sqrt(dx * dx + dy * dy)
      
      setMouseVelocity(distance)
      setMousePos(newPos)
      lastMousePosRef.current = newPos

      // Update blur based on velocity
      const newBlur = Math.min(distance * 0.05, 4) // Max blur of 4px
      setBlur(newBlur)
    }

    // Decay blur over time
    const decayBlur = () => {
      setBlur(prev => Math.max(0, prev * 0.92))
      setMouseVelocity(prev => prev * 0.9)
      frameRef.current = requestAnimationFrame(decayBlur)
    }

    window.addEventListener('mousemove', handleMouseMove)
    frameRef.current = requestAnimationFrame(decayBlur)

    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      style={{
        filter: `blur(${blur}px)`,
        transition: 'filter 0.1s ease-out'
      }}
    >
      {processedWords.map((wordData, index) => (
        <span
          key={`${wordData.word}-${index}`}
          className="absolute font-light select-none"
          style={{
            left: `${wordData.x}%`,
            top: `${wordData.y}%`,
            fontSize: `${wordData.size}rem`,
            opacity: wordData.opacity,
                         color: 'hsl(220, 11%, 22%)', // Very subtle background text
            transform: 'translate(-50%, -50%)',
            fontFamily: 'var(--font-inter)',
            fontWeight: 300,
            letterSpacing: '0.02em'
          }}
        >
          {wordData.word}
        </span>
      ))}
      
      {/* Subtle gradient overlay to ensure text doesn't interfere with readability */}
      <div 
        className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background-dark/20 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, 
              transparent 0%, 
              rgba(220, 220, 220, 0.01) 30%, 
              rgba(220, 220, 220, 0.02) 60%, 
              transparent 100%)
          `
        }}
      />
    </div>
  )
} 
