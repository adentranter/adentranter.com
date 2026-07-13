import Image from "next/image"
import Link from "next/link"
import { CodingStats } from "@/components/coding-stats"
import VoxLogo from "@/components/voxlogo"
import { GitHubActivity } from "@/components/github-activity"
import { NowPlaying } from "@/components/now-playing"
import type { Metadata } from "next"
import { projects } from "./projects/data"

export const metadata: Metadata = {
  title: "Aden Tranter - Software Engineer & Problem Solver",
  description:
    "Software engineer specializing in solving unique problems through code and curiosity.",
  keywords: ["software engineer", "web development", "Voxit", "transcript proofreading"],
  openGraph: {
    title: "Aden Tranter - Software Engineer & Problem Solver",
    description: "Software engineer specializing in solving unique problems through code and curiosity.",
    type: "website",
    url: "https://adentranter.com",
    images: [
      {
        url: "/adentranter.jpg",
        width: 1200,
        height: 630,
        alt: "Aden Tranter",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Aden Tranter - Software Engineer & Problem Solver",
    description: "Software engineer specializing in solving unique problems through code and curiosity.",
    images: ["/adentranter.jpg"],
  },
}

export default function Home() {
  const vox = projects.voxit

  return (
    <div className="flex flex-col gap-12 py-16">
      <section className="flex flex-col items-center text-center gap-4">
        <h1 className="text-3xl sm:text-3xl md:text-4xl font-light bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-secondary">
          Solving Weird Problems Through Code & Curiosity
        </h1>
        <p className="text-lg text-white/80 font-light max-w-xl">
          I dig too deep into how things work, build solutions for problems you didn&apos;t know you had, and
          occasionally make something useful.
        </p>
      </section>

      <div className="w-full h-px bg-primary/50" />

      <section className="space-y-6 max-w-3xl mx-auto w-full px-4" aria-labelledby="projects-heading">
        <div className="text-center space-y-1">
          <div className="flex justify-center">
            <VoxLogo size="lg" className="text-3xl" />
          </div>
          <h2 id="projects-heading" className="text-lg font-light text-white/80 uppercase tracking-[0.18em]">
            Project Spotlight
          </h2>
          <p className="text-white/50 text-sm">
            Transcript proofreading — text and audio bound together.
          </p>
        </div>

        <article className="rounded-xl border border-white/10 bg-accent/5 overflow-hidden flex flex-col shadow-xl">
          <div className="p-4 sm:p-5 bg-gradient-to-b from-black/30 to-transparent">
            <div className="mx-auto max-w-full space-y-0">
              <div className="flex items-center gap-2 rounded-t-lg border border-b-0 border-white/10 bg-[#252530] px-3 py-2">
                <div className="flex flex-1 gap-1.5" aria-hidden>
                  <span className="size-2.5 rounded-full bg-[#ff5f56]/90" />
                  <span className="size-2.5 rounded-full bg-[#ffbd2e]/90" />
                  <span className="size-2.5 rounded-full bg-[#27c93f]/90" />
                </div>
                <span className="min-w-0 max-w-[55%] truncate text-center text-[11px] text-white/35 tabular-nums">
                  voxit.com.au
                </span>
                <div className="flex flex-1 justify-end" aria-hidden />
              </div>
              <div className="relative overflow-hidden rounded-b-lg border border-white/10 bg-[#0d0d0d] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]">
                <div className="aspect-video">
                  {vox.imagePath ? (
                    <Image
                      src={vox.imagePath}
                      alt="Voxit application screenshot"
                      width={1920}
                      height={1080}
                      className="h-full w-full object-contain object-top"
                    />
                  ) : null}
                </div>
              </div>
            </div>
          </div>
          <div className="p-6 flex flex-col gap-3">
            <div className="flex flex-wrap items-baseline gap-3">
              <VoxLogo size="lg" />
              {vox.tagline ? (
                <p className="text-sm text-white/50 tracking-wide">{vox.tagline}</p>
              ) : null}
            </div>
            <p className="text-white/80 leading-relaxed">{vox.description}</p>
            {vox.url ? (
              <Link
                href={vox.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-accent-secondary transition-colors text-sm mt-1 inline-flex w-fit"
              >
                Visit Voxit →
              </Link>
            ) : null}
          </div>
        </article>
      </section>

      <div className="w-full h-px bg-primary/50" />

      <section className="max-w-3xl mx-auto w-full px-4" aria-labelledby="other-sites-heading">
        <div className="text-center space-y-1 mb-8">
          <h2 id="other-sites-heading" className="text-lg font-light text-white/80 uppercase tracking-[0.18em]">
            Other sites
          </h2>
          <p className="text-white/50 text-sm">A few more things I&apos;ve shipped.</p>
        </div>

        <ul className="space-y-3">
          {[
            projects['mail-your-mp'],
            projects['legal-lookup'],
          ].map((project) => {
            const hostname = project.url ? new URL(project.url).hostname : null

            return (
              <li key={project.slug}>
                <Link
                  href={project.url || `/projects/${project.slug}`}
                  target={project.url ? '_blank' : undefined}
                  rel={project.url ? 'noopener noreferrer' : undefined}
                  className="group flex items-baseline justify-between gap-6 rounded-lg border border-white/10 bg-accent/5 px-5 py-4 transition-colors hover:border-white/20 hover:bg-accent/10"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <span className="text-base font-medium text-white group-hover:text-primary transition-colors">
                        {project.title}
                      </span>
                      {hostname ? (
                        <span className="text-xs text-white/35 group-hover:text-white/50 transition-colors">
                          {hostname}
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm text-white/55 leading-relaxed">{project.description}</p>
                  </div>
                  <span
                    aria-hidden
                    className="shrink-0 text-primary/70 group-hover:text-accent-secondary transition-colors"
                  >
                    →
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <div className="w-full h-px bg-primary/50" />

      <section className="max-w-6xl mx-auto w-full px-4" aria-labelledby="stay-in-touch-heading">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="rounded-xl border border-white/10 bg-accent/5 p-6 sm:p-7 space-y-3">
            <h3 id="stay-in-touch-heading" className="text-xl font-semibold">
              Open to consulting
            </h3>
            <p className="text-sm text-white/70">
              Product and engineering help for web apps, internal tools, and odd problems that need a
              clear head. If that sounds useful, say hi.
            </p>
            <Link
              href="https://linkedin.com/in/adentranter"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-accent-secondary transition-colors text-sm inline-flex w-fit"
            >
              Message me on LinkedIn →
            </Link>
          </article>

          <article className="rounded-xl border border-white/10 bg-accent/5 p-6 sm:p-7 space-y-3">
            <h3 className="text-xl font-semibold">My history so far</h3>
            <p className="text-sm text-white/70">
              If you&apos;re curious about my background, values, and how I think about startups and building,
              start here.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                href="/about"
                className="text-primary hover:text-accent-secondary transition-colors text-sm"
              >
                Read my story →
              </Link>
              <Link
                href="/essays"
                className="text-primary hover:text-accent-secondary transition-colors text-sm"
              >
                Browse essays →
              </Link>
            </div>
          </article>
        </div>
      </section>

      <div className="w-full h-px bg-primary/50" />

      <section className="space-y-6 max-w-6xl mx-auto w-full px-4">
        <NowPlaying />
        <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] gap-6">
          <div className="border rounded-lg p-6 sm:p-8 bg-accent/5">
            <GitHubActivity />
          </div>

          <div className="border rounded-lg p-6 sm:p-8 bg-accent/5">
            <CodingStats />
          </div>
        </div>
      </section>
    </div>
  )
}
