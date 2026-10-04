let iosSwitchLabel: HTMLLabelElement | null = null

function getIosSwitchLabel() {
  if (iosSwitchLabel?.isConnected) return iosSwitchLabel
  const label = document.createElement('label')
  label.ariaHidden = 'true'
  label.style.display = 'none'
  const input = document.createElement('input')
  input.type = 'checkbox'
  input.setAttribute('switch', '')
  label.appendChild(input)
  document.body.appendChild(label)
  iosSwitchLabel = label
  return label
}

// navigator.vibrate only needs a past tap, but the iOS switch trick needs a live gesture, and a touch's
// gesture activation only arrives on release, so presses can check this and defer their buzz to pointerup
export function canHapticNow(): boolean {
  if (typeof window === 'undefined') return false
  if (typeof navigator.vibrate === 'function') return true
  const activation = (navigator as Navigator & { userActivation?: { isActive: boolean } }).userActivation
  return activation ? activation.isActive : true
}

// iOS Safari has no navigator.vibrate; toggling a `switch` checkbox inside a user gesture
// fires the system haptic on iOS 18+. Must be called synchronously from a pointer/click handler.
export function haptic(ms = 15) {
  if (typeof window === 'undefined') return
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(ms)
      return
    }
    getIosSwitchLabel().click()
  } catch {}
}
