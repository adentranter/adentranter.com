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
