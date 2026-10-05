"use client"

import { useEffect, useRef, useState } from 'react'
import type { RetroSystem } from '@/lib/retro/systems'

export type ConnectedGamepad = { player: number; name: string }

type Handlers = {
  onButton: (player: number, control: string, state: 'down' | 'up') => void
  onStick: (player: number, x: number, y: number) => void
  onMenu: (player: number) => void
  onConnect?: (player: number) => void
}

const PLAYER_SLOTS = [1, 2]
const STICK_DEADZONE = 0.15
const STICK_DIGITAL_THRESHOLD = 0.5
// 0.05 steps keep a resting thumb from sending a stream of tiny changes
const ANALOG_STEPS = 20

const SELECT_BUTTON = 8
const START_BUTTON = 9
const HOME_BUTTON = 16

type PadState = {
  player: number
  pressed: Set<string>
  stick: { x: number; y: number }
  menu: boolean
  menuLatched: boolean
}

function applyDeadzone(x: number, y: number) {
  const magnitude = Math.hypot(x, y)
  if (magnitude < STICK_DEADZONE) return { x: 0, y: 0 }
  const scale = Math.min(1, (magnitude - STICK_DEADZONE) / (1 - STICK_DEADZONE)) / magnitude
  const quantize = (v: number) => Math.round(v * scale * ANALOG_STEPS) / ANALOG_STEPS
  return { x: quantize(x), y: quantize(y) }
}

function addStickDirections(
  out: Set<string>,
  x: number,
  y: number,
  controls: { right: string; left: string; down: string; up: string },
) {
  if (x >= STICK_DIGITAL_THRESHOLD) out.add(controls.right)
  if (x <= -STICK_DIGITAL_THRESHOLD) out.add(controls.left)
  if (y >= STICK_DIGITAL_THRESHOLD) out.add(controls.down)
  if (y <= -STICK_DIGITAL_THRESHOLD) out.add(controls.up)
}

// Browsers only expose a gamepad once one of its buttons is pressed while the page is open
export function useGamepads(system: RetroSystem, handlers: Handlers): ConnectedGamepad[] {
  const [connected, setConnected] = useState<ConnectedGamepad[]>([])
  const handlersRef = useRef(handlers)
  useEffect(() => {
    handlersRef.current = handlers
  })

  useEffect(() => {
    if (typeof navigator === 'undefined' || !navigator.getGamepads) return
    const pads = new Map<number, PadState>()
    let signature = ''
    let frame = 0

    const readControls = (pad: Gamepad) => {
      const isPressed = (i: number) => !!pad.buttons[i]?.pressed
      const controls = new Set<string>()
      for (const [index, control] of Object.entries(system.gamepadButtons)) {
        if (isPressed(Number(index))) controls.add(control)
      }
      if (system.gamepadLeftStick === 'dpad') {
        addStickDirections(controls, pad.axes[0] ?? 0, pad.axes[1] ?? 0, { right: 'right', left: 'left', down: 'down', up: 'up' })
      }
      if (system.gamepadRightStick) {
        addStickDirections(controls, pad.axes[2] ?? 0, pad.axes[3] ?? 0, system.gamepadRightStick)
      }
      const menu = isPressed(HOME_BUTTON) || (isPressed(SELECT_BUTTON) && isPressed(START_BUTTON))
      const menuButtonHeld = isPressed(HOME_BUTTON) || isPressed(SELECT_BUTTON) || isPressed(START_BUTTON)
      const stick = system.gamepadLeftStick === 'analog'
        ? applyDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0)
        : { x: 0, y: 0 }
      return { controls, stick, menu, menuButtonHeld }
    }

    // The menu combo must not also reach the game as Start / Select, even while it is being let go
    const suppressMenuButtons = (controls: Set<string>) => {
      for (const index of [SELECT_BUTTON, START_BUTTON]) {
        const control = system.gamepadButtons[index]
        if (control) controls.delete(control)
      }
    }

    const release = (state: PadState) => {
      const { onButton, onStick } = handlersRef.current
      for (const control of state.pressed) onButton(state.player, control, 'up')
      if (state.stick.x !== 0 || state.stick.y !== 0) onStick(state.player, 0, 0)
    }

    const poll = () => {
      frame = window.requestAnimationFrame(poll)
      const { onButton, onStick, onMenu, onConnect } = handlersRef.current
      const live = new Map<number, Gamepad>()
      for (const pad of navigator.getGamepads()) {
        if (pad?.connected) live.set(pad.index, pad)
      }

      for (const [index, state] of pads) {
        if (live.has(index)) continue
        release(state)
        pads.delete(index)
      }

      for (const [index, pad] of live) {
        const current = readControls(pad)
        let state = pads.get(index)
        if (!state) {
          const taken = new Set(Array.from(pads.values(), (p) => p.player))
          const player = PLAYER_SLOTS.find((slot) => !taken.has(slot))
          if (player === undefined) continue
          // Whatever is held while connecting (usually the button that woke the pad) is ignored until released
          state = {
            player,
            pressed: current.controls,
            stick: { x: 0, y: 0 },
            menu: current.menu,
            menuLatched: current.menu,
          }
          pads.set(index, state)
          onConnect?.(player)
          continue
        }

        if (current.menu) state.menuLatched = true
        else if (!current.menuButtonHeld) state.menuLatched = false
        if (state.menuLatched) suppressMenuButtons(current.controls)

        for (const control of current.controls) {
          if (!state.pressed.has(control)) onButton(state.player, control, 'down')
        }
        for (const control of state.pressed) {
          if (!current.controls.has(control)) onButton(state.player, control, 'up')
        }
        state.pressed = current.controls

        if (current.menu && !state.menu) onMenu(state.player)
        state.menu = current.menu

        if (current.stick.x !== state.stick.x || current.stick.y !== state.stick.y) {
          state.stick = current.stick
          onStick(state.player, current.stick.x, current.stick.y)
        }
      }

      const list = Array.from(pads.entries(), ([index, state]) => ({
        player: state.player,
        name: (live.get(index)?.id ?? '').replace(/\s*\(.*\)\s*$/, '') || 'Gamepad',
      })).sort((a, b) => a.player - b.player)
      const nextSignature = list.map((p) => `${p.player}:${p.name}`).join('|')
      if (nextSignature !== signature) {
        signature = nextSignature
        setConnected(list)
      }
    }

    frame = window.requestAnimationFrame(poll)
    return () => {
      window.cancelAnimationFrame(frame)
      for (const state of pads.values()) release(state)
      setConnected([])
    }
  }, [system])

  return connected
}
