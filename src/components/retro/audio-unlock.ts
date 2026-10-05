"use client"

// Safari only lets Web Audio start inside a click or key press, and gamepad presses don't count, so a
// pad-launched game would sit behind EmulatorJS's "Click to resume" popup. A context started during an
// earlier gesture is kept aside and handed to the next emulator that asks for one.

const GESTURE_EVENTS = ['mousedown', 'click', 'keydown', 'touchend'] as const

let NativeAudioContext: typeof AudioContext | null = null
let spare: AudioContext | null = null

function currentEmulatorAudio(): AudioContext | null {
  return (window as any).EJS_emulator?.Module?.AL?.currentCtx?.audioCtx ?? null
}

function patchAudioContext() {
  if (NativeAudioContext) return
  const w = window as any
  const Native: typeof AudioContext | undefined = w.AudioContext ?? w.webkitAudioContext
  if (!Native) return
  NativeAudioContext = Native
  function UnlockedAudioContext(options?: AudioContextOptions) {
    if (spare && spare.state !== 'closed') {
      const ctx = spare
      spare = null
      return ctx
    }
    return new Native(options)
  }
  UnlockedAudioContext.prototype = Native.prototype
  w.AudioContext = UnlockedAudioContext
  if (w.webkitAudioContext) w.webkitAudioContext = UnlockedAudioContext
}

function onGesture() {
  const current = currentEmulatorAudio()
  if (current?.state === 'suspended') void current.resume().catch(() => {})
  if (!NativeAudioContext) return
  if (!spare || spare.state === 'closed') {
    try { spare = new NativeAudioContext() } catch { spare = null }
  }
  if (spare?.state === 'suspended') void spare.resume().catch(() => {})
}

export function installAudioUnlock(): () => void {
  patchAudioContext()
  for (const event of GESTURE_EVENTS) document.addEventListener(event, onGesture, true)
  return () => {
    for (const event of GESTURE_EVENTS) document.removeEventListener(event, onGesture, true)
  }
}

export function isEmulatorAudioBlocked() {
  return currentEmulatorAudio()?.state === 'suspended'
}
