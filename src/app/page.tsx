import Image from "next/image"
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
  keywords: ["software engineer", "web development", "Voxit", "Transcription Stepping Stone"],
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

const HIDDEN_FROM_HOME = new Set(["ivf-journey", "mission-control", "twine"])

/** Shown only if someone strips the blur in DevTools—real copy stays off the homepage for now. */
const PROJECTS_DECOY_BODY =
  "Oh—you weren't meant to be able to read this. Proper case studies are still half-baked. If you made it this far, you probably should just email me instead of reverse-engineering a personal site."

const PROJECTS_DECOY_TAGLINE = "Nothing to see here yet. Seriously."

export default function Home() {
  const teaserProjects = Object.values(projects)
    .filter((p) => p.featured && !HIDDEN_FROM_HOME.has(p.slug) && p.imagePath)
    .sort((a, b) => {
      if (a.slug === "voxit") return -1
      if (b.slug === "voxit") return 1
      return 0
    })

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

      {/* Contact — primary while project write-ups are in progress */}
      <section className="space-y-6 text-center max-w-xl mx-auto" aria-labelledby="contact-heading">
        <h2 id="contact-heading" className="text-2xl font-light">
          While the project pages are still in the oven
        </h2>
        <p className="text-white/80 leading-relaxed">
          I&apos;m not leaving the site empty—I&apos;m just not ready to publish the long-form stuff yet. If
          something here resonated, or you have a weird problem that needs a second brain, I&apos;d rather talk
          than polish pixels in silence.
        </p>
        <p className="text-white/70 leading-relaxed">
          I love a good rant. Email me. If you can&apos;t figure that out, you probably shouldn&apos;t be
          emailing me anyway.
        </p>
      </section>

      <div className="w-full h-px bg-primary/50" />

      {/* Blurred project teaser (visual only; decoy text under blur) */}
      <section className="space-y-6" aria-labelledby="projects-teaser-heading">
        <div className="text-center space-y-2">
          <h2 id="projects-teaser-heading" className="text-2xl font-light">
            Projects
          </h2>
          <p className="text-white/50 text-sm max-w-md mx-auto">
            Sneak peek—details coming soon. (If you cheat with DevTools, read what&apos;s underneath at your
            own risk.)
          </p>
        </div>

        <p className="sr-only">
          Detailed project write-ups are not published on the homepage yet. Use the contact section to reach
          out.
        </p>

        <div className="relative rounded-xl overflow-hidden border border-white/10 bg-[#0d0d0d] shadow-xl">
          <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
            <span className="text-sm tracking-wide uppercase text-white/40 border border-white/15 bg-black/40 px-4 py-2 rounded-md backdrop-blur-sm">
              Coming soon
            </span>
          </div>

          <div
            className="select-none blur-md sm:blur-lg scale-[1.03] opacity-[0.92] pointer-events-none"
            aria-hidden="true"
          >
            {teaserProjects.map((project, index) => (
              <div key={project.slug}>
                <section className="grid grid-cols-1 lg:grid-cols-2 gap-12 p-6 lg:p-10">
                  <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a1a] shadow-xl">
                    <div className="absolute top-0 left-0 right-0 h-8 bg-[#2a2a2a] flex items-center px-4 gap-2 z-[1]">
                      <div className="flex gap-1.5">
                        <div className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                        <div className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                        <div className="w-3 h-3 rounded-full bg-[#27c93f]" />
                      </div>
                      <div className="ml-4 flex-1 bg-[#1a1a1a] rounded-md h-5 flex items-center px-3">
                        <span className="text-xs text-white/50">preview.local</span>
                      </div>
                    </div>

                    <div className="pt-8">
                      <h3 className="text-2xl mb-4 font-light text-white/30">Work in progress</h3>
                      <Image
                        src={project.imagePath}
                        alt=""
                        width={1920}
                        height={1080}
                        className="w-full"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-2xl mb-4 font-light invisible">Spacer</h3>
                    <span className="leading-relaxed flex items-center gap-2">
                      {project.logoComponent === "voxit" ? <Logo size="lg" /> : null}
                      <span className="text-[19px] tracking-[0.122em] font-[100] text-white/70">
                        {PROJECTS_DECOY_TAGLINE}
                      </span>
                    </span>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs px-2 py-1 rounded border border-white/20 text-white/50">
                        Redacted
                      </span>
                      <span className="text-xs px-2 py-1 rounded bg-white/10 text-white/50 border border-white/20">
                        TBD
                      </span>
                    </div>
                    <div className="space-y-4 text-white/70">
                      <p>{PROJECTS_DECOY_BODY}</p>
                      <p className="text-white/50">Tech stack: nice try</p>
                      <span className="text-white/40 inline-block">Learn more → (no you won&apos;t)</span>
                    </div>
                  </div>
                </section>
                {index < teaserProjects.length - 1 && (
                  <div className="w-full h-px bg-primary/30 mx-6 lg:mx-10 max-w-[calc(100%-3rem)]" />
                )}
              </div>
            ))}
          </div>
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
