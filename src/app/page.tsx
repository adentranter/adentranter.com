import Image from "next/image"
import Link from "next/link"
import { GitHubIcon } from "@/components/icons"
import { GitHubContributions } from "@/components/github-contributions"
import { CodingStats } from "@/components/coding-stats"
import Logo from "@/components/voxlogo"
import { GitHubStats } from "@/components/github-stats"
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
    url: "https://adentranter.com", // Replace with your actual domain
    images: [
      {
        url: "/adentranter.jpg", // Replace with your actual OG image path
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
    images: ["/adentranter.jpg"], // Replace with your actual Twitter card image path
  },
}

export default function Home() {
  const vox = projects.voxit
  const missionControl = projects["mission-control"]

  return (
    <div className="flex flex-col gap-16 py-16">
      {/* Hero Section */}
      <section className="flex flex-col items-center text-center gap-6">
        <h1 className="text-3xl sm:text-3xl md:text-4xl font-light bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-secondary">
          Solving Weird Problems Through Code & Curiosity
        </h1>
        <p className="text-xl text-white/80 font-light max-w-2xl">
          I dig too deep into how things work, build solutions for problems you didn&apos;t know you had, and
          occasionally make something useful
        </p>
      </section>

      <div className="w-full h-px bg-primary/50" />

      {/* Spotlight projects */}
      <section className="space-y-8 max-w-6xl mx-auto w-full px-4" aria-labelledby="projects-heading">
        <div className="text-center space-y-2">
          <h2 id="projects-heading" className="text-2xl font-light">
            Projects
          </h2>
          <p className="text-white/50 text-sm max-w-lg mx-auto">
            One product you can try today, and the internal platform I ship at work.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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
            <div className="p-6 flex flex-col gap-4 flex-1">
              <div className="flex flex-wrap items-baseline gap-3">
                <Logo size="lg" />
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
                  className="text-primary hover:text-accent-secondary transition-colors text-sm mt-auto inline-flex w-fit"
                >
                  Visit Voxit →
                </Link>
              ) : null}
            </div>
          </article>

          <article className="rounded-xl border border-white/10 bg-accent/5 overflow-hidden flex flex-col shadow-xl">
            <div className="relative aspect-video bg-[#1a1a1a] overflow-hidden">
              {missionControl.imagePath ? (
                <Image
                  src={missionControl.imagePath}
                  alt="Blurred preview of Mission Control"
                  width={1920}
                  height={1080}
                  className="object-cover w-full h-full scale-[1.04] blur-sm"
                />
              ) : null}
            </div>
            <div className="p-6 flex flex-col gap-3 flex-1">
              <h3 className="text-xl font-light text-white">{missionControl.title}</h3>
              <p className="text-white/80 leading-relaxed">{missionControl.blurb}</p>
              <p className="text-white/45 text-sm mt-auto">Internal — no public link.</p>
            </div>
          </article>
        </div>
      </section>

      <div className="w-full h-px bg-primary/50" />

      {/* Stats Section */}
      <section className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="border rounded-lg p-8 bg-accent/5 space-y-4">
            <div className="flex items-center gap-3">
              <GitHubIcon className="w-6 h-6" />
              <h3 className="text-2xl font-bold">GitHub Activity</h3>
            </div>
            <GitHubStats />
            <GitHubContributions />
          </div>

          <div className="border rounded-lg p-8 bg-accent/5">
            <CodingStats />
          </div>
        </div>
      </section>
    </div>
  )
}
