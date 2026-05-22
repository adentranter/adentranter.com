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
          <h2 id="projects-heading" className="text-2xl font-light">
            Project
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
                className="text-primary hover:text-accent-secondary transition-colors text-sm mt-1 inline-flex w-fit"
              >
                Visit Voxit →
              </Link>
            ) : null}
          </div>
        </article>
      </section>

      <div className="w-full h-px bg-primary/50" />

      <section className="space-y-6 max-w-6xl mx-auto w-full">
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
