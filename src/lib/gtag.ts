export const GA_TRACKING_ID = "G-D7MGQXTCLN"

// Because this runs only in the browser, we guard against SSR
declare global {
  interface Window {
    gtag: (...args: unknown[]) => void
  }
}

/**
 * Track a pageview. Call this with the current URL after a route change.
 */
export const pageview = (url: string) => {
  if (typeof window === "undefined" || !window.gtag) return

  window.gtag("config", GA_TRACKING_ID, {
    page_path: url,
  })
}

/**
 * Generic event tracker.
 * @example event({ action: "play", category: "Video", label: "Homepage Hero", value: 1 })
 */
export const event = <T extends string | undefined = undefined>({
  action,
  category,
  label,
  value,
}: {
  action: string
  category: string
  label?: T
  value?: number
}) => {
  if (typeof window === "undefined" || !window.gtag) return

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value,
  })
} 