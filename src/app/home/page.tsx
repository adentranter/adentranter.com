import type { Metadata } from "next"

import HomeLogoutButton from "@/components/home/home-logout-button"
import { HOME_SECTIONS, servicesForGroup, type HomeService } from "@/lib/home-dashboard"
import { getLatestHomeIp } from "@/lib/home-db"

export const dynamic = "force-dynamic"

export const metadata: Metadata = {
  title: "Media Server Dashboard",
  robots: {
    index: false,
    follow: false,
  },
}

function formatLastSeen(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Australia/Brisbane",
  }).format(date)
}

function ServiceCard({ service }: { service: HomeService }) {
  const cardClass = service.external
    ? "border-t-[3px] border-t-indigo-500"
    : service.lanOnly
      ? "border-t-[3px] border-t-amber-400"
      : ""

  return (
    <a
      href={service.href}
      target={service.external ? "_blank" : undefined}
      rel={service.external ? "noreferrer" : undefined}
      className={`flex flex-col items-center rounded-2xl bg-white p-7 text-center text-inherit no-underline shadow-[0_10px_30px_rgba(0,0,0,0.2)] transition hover:-translate-y-2 hover:shadow-[0_20px_40px_rgba(0,0,0,0.3)] ${cardClass}`}
    >
      <div className="mb-3.5 text-[44px] leading-none">{service.icon}</div>
      <h2 className="mb-1.5 text-[1.4rem] font-semibold text-gray-800">{service.name}</h2>
      <p className="text-sm leading-snug text-gray-600">{service.description}</p>

      {service.port ? (
        <span className="mt-2.5 inline-block rounded-xl bg-gray-100 px-3 py-1 font-mono text-[0.82rem] text-gray-600">
          {service.port}
        </span>
      ) : null}

      {service.badge ? (
        <span className="mt-2.5 inline-block rounded-xl bg-indigo-50 px-3 py-1 text-[0.82rem] font-semibold text-indigo-600">
          {service.badge}
        </span>
      ) : null}

      {service.lanOnly ? (
        <span className="mt-2.5 inline-block rounded-xl bg-amber-50 px-3 py-1 text-[0.82rem] font-semibold text-amber-700">
          LAN / VPN only
        </span>
      ) : null}

      {service.clients?.length ? (
        <div className="mt-2.5 flex flex-wrap justify-center gap-1.5">
          {service.clients.map((client) => (
            <span
              key={client}
              className="rounded-[10px] bg-purple-50 px-2.5 py-0.5 text-[0.78rem] text-purple-700"
            >
              {client}
            </span>
          ))}
        </div>
      ) : null}
    </a>
  )
}

export default async function HomeDashboardPage() {
  const homeIp = await getLatestHomeIp()

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-purple-600 to-purple-800 px-5 py-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-center text-4xl font-bold text-white drop-shadow sm:text-left sm:text-5xl">
              🎬 Media Server Dashboard
            </h1>
            <p className="mt-2 text-center text-sm text-white/80 sm:text-left">
              Media apps are reachable from anywhere. Admin tools require your home network or VPN.
            </p>
          </div>
          <div className="flex justify-center sm:justify-end">
            <HomeLogoutButton />
          </div>
        </div>

        <div className="mb-8 rounded-2xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-white backdrop-blur">
          <p className="font-medium">Home public IP</p>
          {homeIp ? (
            <>
              <p className="mt-1 font-mono text-lg">{homeIp.ip}</p>
              <p className="mt-1 text-white/75">Last reported {formatLastSeen(homeIp.updatedAt)}</p>
            </>
          ) : (
            <p className="mt-1 text-white/75">
              No IP recorded yet. Run the home-server cron job to report your current address.
            </p>
          )}
        </div>

        {HOME_SECTIONS.map((section) => {
          const services = servicesForGroup(section.id)
          if (services.length === 0) {
            return null
          }

          return (
            <section key={section.id} className="mb-10">
              <p className="mb-4 text-center text-[0.85rem] uppercase tracking-[0.2em] text-white/70">
                {section.label}
              </p>
              {section.lanOnly ? (
                <p className="mb-4 text-center text-sm text-amber-100">
                  These links only work on your home LAN or over VPN — they are not exposed to the internet.
                </p>
              ) : null}
              <div className="grid grid-cols-[repeat(auto-fit,minmax(260px,1fr))] gap-5">
                {services.map((service) => (
                  <ServiceCard key={`${section.id}-${service.name}-${service.href}`} service={service} />
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}
