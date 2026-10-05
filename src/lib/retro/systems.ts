export type RetroSystemId = 'snes' | 'n64'

type KeyBinding = { value: string }

export type RetroSystem = {
  id: RetroSystemId
  name: string
  core: string
  // Lowercase, without the dot; archives are extracted by EmulatorJS
  romExtensions: readonly string[]
  romDb: string
  romDirs: readonly { dir: string; url: string }[]
  manifestUrl: string
  // Prepended to cloud save game keys; SNES has none so its existing saves stay readable
  saveKeyPrefix: string
  // RetroArch joypad ids used by EmulatorJS's simulateInput
  buttonIndex: Record<string, number>
  hasAnalogStick: boolean
  // W3C "standard" gamepad button index -> control name
  gamepadButtons: Record<number, string>
  // SNES has no analog stick, so a gamepad's left stick doubles as its d-pad
  gamepadLeftStick: 'dpad' | 'analog'
  // Digital controls pressed when the right stick leans past a threshold
  gamepadRightStick?: { right: string; left: string; down: string; up: string }
  // Replaces EmulatorJS's built-in keyboard defaults, so every player must be present (key names follow its keyMap)
  defaultControls?: Record<number, Record<number, KeyBinding>>
  // KeyboardEvent.code values that should not scroll the page during play
  gameKeys: readonly string[]
  keyboardHelp: readonly string[]
  keyboardBlurb: string
  controllerBlurb: string
}

// EmulatorJS treats ids 16-23 as analog axes, which take a 0..0x7fff magnitude instead of 0/1
export const ANALOG_MAX = 0x7fff
export const STICK_INDEX = { right: 16, left: 17, down: 18, up: 19 } as const

export function isAnalogAxis(index: number) {
  return index >= 16 && index <= 23
}

const SNES: RetroSystem = {
  id: 'snes',
  name: 'SNES',
  core: 'snes',
  romExtensions: ['smc', 'sfc', 'fig', 'swc', 'zip', '7z'],
  romDb: 'snes-roms',
  romDirs: [
    { dir: 'roms', url: '/roms' },
    { dir: 'snes', url: '/snes' },
    { dir: '@roms', url: '/@roms' },
  ],
  manifestUrl: '/snes/roms.json',
  saveKeyPrefix: '',
  buttonIndex: {
    b: 0,
    y: 1,
    select: 2,
    start: 3,
    up: 4,
    down: 5,
    left: 6,
    right: 7,
    a: 8,
    x: 9,
    l: 10,
    r: 11,
  },
  hasAnalogStick: false,
  // By position, matching the SNES layout: bottom = B, right = A, left = Y, top = X
  gamepadButtons: {
    0: 'b',
    1: 'a',
    2: 'y',
    3: 'x',
    4: 'l',
    5: 'r',
    8: 'select',
    9: 'start',
    12: 'up',
    13: 'down',
    14: 'left',
    15: 'right',
  },
  gamepadLeftStick: 'dpad',
  gameKeys: [
    'KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyX', 'KeyZ', 'KeyC', 'KeyV', 'KeyQ', 'KeyE', 'Enter', 'ShiftLeft',
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyI', 'KeyO', 'KeyK', 'KeyL', 'KeyU', 'KeyP', 'Space', 'ShiftRight',
  ],
  keyboardHelp: [
    'P1: WASD move · X Z C V = A B X Y · Q E = L R · Enter / L-Shift = Start / Select',
    'P2: Arrows move · I O K L = A B X Y · U P = L R · Space / R-Shift = Start / Select',
  ],
  keyboardBlurb: 'Start playing immediately. Keyboard controls support two players (WASD + Arrow keys) and work without a phone.',
  controllerBlurb: 'Each phone becomes a dedicated SNES controller with haptics.',
}

const N64: RetroSystem = {
  id: 'n64',
  name: 'N64',
  core: 'n64',
  romExtensions: ['z64', 'n64', 'v64', 'zip', '7z'],
  romDb: 'n64-roms',
  romDirs: [
    { dir: 'roms/n64', url: '/roms/n64' },
    { dir: 'n64', url: '/n64' },
  ],
  manifestUrl: '/n64/roms.json',
  saveKeyPrefix: 'n64:',
  buttonIndex: {
    a: 0,
    b: 1,
    start: 3,
    up: 4,
    down: 5,
    left: 6,
    right: 7,
    l: 10,
    r: 11,
    z: 12,
    cright: 20,
    cleft: 21,
    cdown: 22,
    cup: 23,
  },
  hasAnalogStick: true,
  // Bottom = A and left = B like RetroArch; right/top cover C buttons on pads without a right stick
  gamepadButtons: {
    0: 'a',
    1: 'cdown',
    2: 'b',
    3: 'cleft',
    4: 'l',
    5: 'r',
    6: 'z',
    7: 'z',
    9: 'start',
    12: 'up',
    13: 'down',
    14: 'left',
    15: 'right',
  },
  gamepadLeftStick: 'analog',
  gamepadRightStick: { right: 'cright', left: 'cleft', down: 'cdown', up: 'cup' },
  defaultControls: {
    0: {
      0: { value: 'x' },
      1: { value: 'z' },
      2: { value: '' },
      3: { value: 'enter' },
      4: { value: 't' },
      5: { value: 'g' },
      6: { value: 'f' },
      7: { value: 'h' },
      8: { value: '' },
      9: { value: '' },
      10: { value: 'q' },
      11: { value: 'e' },
      12: { value: 'space' },
      13: { value: '' },
      16: { value: 'right arrow' },
      17: { value: 'left arrow' },
      18: { value: 'down arrow' },
      19: { value: 'up arrow' },
      20: { value: 'l' },
      21: { value: 'j' },
      22: { value: 'k' },
      23: { value: 'i' },
      24: { value: '1' },
      25: { value: '2' },
      26: { value: '3' },
    },
    1: {},
    2: {},
    3: {},
  },
  gameKeys: [
    'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyX', 'KeyZ', 'Enter', 'Space', 'KeyQ', 'KeyE',
    'KeyI', 'KeyJ', 'KeyK', 'KeyL', 'KeyT', 'KeyF', 'KeyG', 'KeyH',
  ],
  keyboardHelp: [
    'Arrows = analog stick · X / Z = A / B · Space = Z · Q E = L R · Enter = Start',
    'I J K L = C buttons · T F G H = D-pad · Phones can join as player 1 or 2',
  ],
  keyboardBlurb: 'Start playing immediately with the arrow keys as the analog stick. Works without a phone.',
  controllerBlurb: 'Each phone becomes an N64 controller with an analog stick, C buttons and Z.',
}

export const RETRO_SYSTEMS: Record<RetroSystemId, RetroSystem> = { snes: SNES, n64: N64 }

export const RETRO_SYSTEM_IDS = Object.keys(RETRO_SYSTEMS) as RetroSystemId[]

export function isRetroSystemId(value: unknown): value is RetroSystemId {
  return typeof value === 'string' && Object.prototype.hasOwnProperty.call(RETRO_SYSTEMS, value)
}

export function getRetroSystem(id: RetroSystemId): RetroSystem {
  return RETRO_SYSTEMS[id]
}

export function isRomFileName(system: RetroSystem, name: string) {
  const ext = name.toLowerCase().split('.').pop() ?? ''
  return name.includes('.') && system.romExtensions.includes(ext)
}

// Handles archives named after the ROM inside them, e.g. "Game.n64.zip"
export function stripRomExtension(system: RetroSystem, name: string) {
  let out = name
  for (let i = 0; i < 2 && isRomFileName(system, out); i++) out = out.slice(0, out.lastIndexOf('.'))
  return out
}

export function romAcceptAttribute(system: RetroSystem) {
  return [
    ...system.romExtensions.map((ext) => `.${ext}`),
    'application/zip',
    'application/x-7z-compressed',
    'application/octet-stream',
  ].join(',')
}

export function pusherChannelFor(system: RetroSystemId, sessionId: string) {
  return `${system}-${sessionId}`
}

export function pushUrlFor(system: RetroSystemId, sessionId: string, playerId: string) {
  return `/api/retro/${system}/${encodeURIComponent(sessionId)}/push?playerId=${encodeURIComponent(playerId)}`
}
