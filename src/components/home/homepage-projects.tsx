import VoxLogo from "@/components/voxlogo"
import { FounderConfigMark } from "@/components/project-brands/founder-config-mark"
import { LaunchOsMark } from "@/components/project-brands/launchos-mark"
import { LegalLookupMark } from "@/components/project-brands/legal-lookup-mark"
import { MailYourMpMark } from "@/components/project-brands/mail-your-mp-mark"
import { ProjectBrandRow } from "@/components/home/project-brand-row"
import {
  homepageProjects,
  projects,
  type HomepageBrandKey,
} from "@/app/projects/data"
import type { ReactNode } from "react"

const brandMarks: Record<HomepageBrandKey, ReactNode> = {
  voxit: <VoxLogo size="lg" asMark />,
  "legal-lookup": <LegalLookupMark />,
  "founder-agreements": <FounderConfigMark />,
  launchos: <LaunchOsMark />,
  "mail-your-mp": <MailYourMpMark />,
}

export function HomepageProjects() {
  return (
    <section className="mx-auto w-full max-w-5xl space-y-2 px-4" aria-labelledby="projects-heading">
      <div className="mb-8 space-y-1 text-center">
        <h2
          id="projects-heading"
          className="text-lg font-light uppercase tracking-[0.18em] text-white/80"
        >
          Building
        </h2>
        <p className="text-sm text-white/50">A few things I&apos;m shipping.</p>
      </div>

      <ul className="space-y-4">
        {homepageProjects.map(({ slug, cardClassName }) => {
          const project = projects[slug]
          const href = project.url || `/projects/${slug}`
          const hostname = project.url ? new URL(project.url).hostname : slug
          const byline = project.byline || project.tagline || project.description

          return (
            <ProjectBrandRow
              key={slug}
              href={href}
              hostname={hostname}
              mark={brandMarks[slug]}
              byline={byline}
              audience={project.audience || project.description}
              cardClassName={cardClassName}
            />
          )
        })}
      </ul>
    </section>
  )
}
