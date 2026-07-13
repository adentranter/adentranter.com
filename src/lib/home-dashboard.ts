export type HomeServiceGroup = "media" | "downloads" | "system" | "external"

export interface HomeService {
  name: string
  icon: string
  description: string
  group: HomeServiceGroup
  href: string
  port?: string
  badge?: string
  clients?: string[]
  external?: boolean
  lanOnly?: boolean
}

const LAN_HOST = "10.69.69.9"

export const HOME_SERVICES: HomeService[] = [
  {
    name: "Jellyfin",
    icon: "📺",
    description: "Watch your movies and TV shows",
    group: "media",
    href: "https://jellyfin.adentranter.com",
    badge: "jellyfin.adentranter.com",
    external: true,
  },
  {
    name: "Navidrome",
    icon: "🎵",
    description: "Self-hosted music streaming",
    group: "media",
    href: "https://music.adentranter.com",
    badge: "music.adentranter.com",
    external: true,
  },
  {
    name: "Kavita",
    icon: "📚",
    description: "Read your books and comics",
    group: "media",
    href: "https://books.adentranter.com",
    badge: "books.adentranter.com",
    external: true,
  },
  {
    name: "Radarr",
    icon: "🎬",
    description: "Manage and download movies",
    group: "downloads",
    href: `http://${LAN_HOST}:7878`,
    port: ":7878",
    lanOnly: true,
  },
  {
    name: "Sonarr",
    icon: "📹",
    description: "Manage and download TV shows",
    group: "downloads",
    href: `http://${LAN_HOST}:8989`,
    port: ":8989",
    lanOnly: true,
  },
  {
    name: "Lidarr",
    icon: "🎸",
    description: "Manage and download music",
    group: "downloads",
    href: `http://${LAN_HOST}:8686`,
    port: ":8686",
    lanOnly: true,
  },
  {
    name: "LazyLibrarian",
    icon: "📖",
    description: "Manage and download books",
    group: "downloads",
    href: `http://${LAN_HOST}:5299`,
    port: ":5299",
    lanOnly: true,
  },
  {
    name: "SABnzbd",
    icon: "⬇️",
    description: "NZB download client",
    group: "downloads",
    href: `http://${LAN_HOST}:8080`,
    port: ":8080",
    lanOnly: true,
  },
  {
    name: "Bazarr",
    icon: "💬",
    description: "Automatic subtitle downloads",
    group: "downloads",
    href: `http://${LAN_HOST}:6767`,
    port: ":6767",
    lanOnly: true,
  },
  {
    name: "Portainer",
    icon: "🐳",
    description: "Docker container management",
    group: "system",
    href: `https://${LAN_HOST}:9443`,
    port: ":9443",
    lanOnly: true,
  },
  {
    name: "Firefly III",
    icon: "💰",
    description: "Personal finance management",
    group: "system",
    href: `http://${LAN_HOST}:8081`,
    port: ":8081",
    lanOnly: true,
  },
  {
    name: "Wiki.js",
    icon: "📖",
    description: "Personal knowledge base",
    group: "system",
    href: `http://${LAN_HOST}:3000`,
    port: ":3000",
    lanOnly: true,
  },
  {
    name: "Nginx Proxy Manager",
    icon: "🔀",
    description: "Reverse proxy & SSL management",
    group: "system",
    href: `http://${LAN_HOST}:8090`,
    port: ":8090",
    lanOnly: true,
  },
  {
    name: "Navidrome",
    icon: "🎵",
    description: "Access your music from anywhere",
    group: "external",
    href: "https://media.adentranter.com",
    badge: "media.adentranter.com",
    external: true,
    clients: [
      "🖥 Feishin (Mac/Win)",
      "📱 Substreamer (iOS)",
      "🤖 Symfonium (Android)",
    ],
  },
]

export const HOME_SECTIONS: { id: HomeServiceGroup; label: string; lanOnly?: boolean }[] = [
  { id: "media", label: "📺 Media — available anywhere" },
  { id: "downloads", label: "⬇️ Downloads — home network / VPN only", lanOnly: true },
  { id: "system", label: "🔧 System — home network / VPN only", lanOnly: true },
  { id: "external", label: "🌐 External access" },
]

export function servicesForGroup(group: HomeServiceGroup): HomeService[] {
  return HOME_SERVICES.filter((service) => service.group === group)
}
