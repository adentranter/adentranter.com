import Link from "next/link"
import { CodingStats } from "@/components/coding-stats"
import { GitHubActivity } from "@/components/github-activity"
import { HomepageProjects } from "@/components/home/homepage-projects"
import { NowPlaying } from "@/components/now-playing"
import type { Metadata } from "next"

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

      <HomepageProjects />

      <div className="w-full h-px bg-primary/50" />

      <section className="max-w-6xl mx-auto w-full px-4" aria-labelledby="stay-in-touch-heading">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <article className="rounded-xl border border-white/10 bg-accent/5 p-6 sm:p-7 space-y-3">
            <h3 id="stay-in-touch-heading" className="text-xl font-semibold text-white">
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
            <h3 className="text-xl font-semibold text-white">My history so far</h3>
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
