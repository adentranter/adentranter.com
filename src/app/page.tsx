import Image from "next/image"
import Link from "next/link"
import { GitHubIcon } from "@/components/icons"
import { GitHubContributions } from "@/components/github-contributions"
import { CodingStats } from "@/components/coding-stats"
import Logo from "@/components/voxlogo"
import TwineLogo from "@/components/twineLogo"
import { GitHubStats } from "@/components/github-stats"
import type { Metadata } from "next"
import { projects } from "./projects/data"

export const metadata: Metadata = {
  title: "Aden Tranter - Software Engineer & Problem Solver",
  description:
    "Software engineer specializing in solving unique problems through code and curiosity. Featuring projects like Voxit, real-time transcription technology.",
  keywords: ["software engineer", "web development", "transcription technology", "Voxit", "Transcription Stepping Stone"],
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
  const featuredProjects = Object.values(projects)
    .filter((p) => p.featured)
    .sort((a, b) => {
      // Keep twine first, then voxit, then others
      if (a.slug === 'twine') return -1
      if (b.slug === 'twine') return 1
      if (a.slug === 'voxit') return -1
      if (b.slug === 'voxit') return 1
      return 0
    })

  const getProjectLabel = (index: number, slug: string) => {
    if (index === 0) return 'Primary Project'
    if (index === 1) return 'Secondary Project'
    return null
  }

  const getLogoComponent = (project: typeof projects[string]) => {
    if (project.logoComponent === 'voxit') return <Logo size="lg" />
    if (project.logoComponent === 'twine') return <TwineLogo size="large" />
    if (project.logoImagePath) {
      return (
        <Image
          src={project.logoImagePath}
          alt={`${project.title} Logo`}
          width={120}
          height={40}
          className="h-10 w-auto"
        />
      )
    }
    return null
  }

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

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

      {/* Featured Projects */}
      {featuredProjects.map((project, index) => {
        const projectLabel = getProjectLabel(index, project.slug)
        const LogoComponent = getLogoComponent(project)
        
        return (
          <div key={project.slug}>
            <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              {/* Project Screenshot */}
              {project.imagePath && (
                <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a1a] shadow-xl">
                  {/* Browser Chrome */}
                  <div className="absolute top-0 left-0 right-0 h-8 bg-[#2a2a2a] flex items-center px-4 gap-2">
                    {/* Window Controls */}
                    <div className="flex gap-1.5">
                      <div className="w-3 h-3 rounded-full bg-[#ff5f56]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#ffbd2e]"></div>
                      <div className="w-3 h-3 rounded-full bg-[#27c93f]"></div>
                    </div>
                    {/* URL Bar */}
                    <div className="ml-4 flex-1 bg-[#1a1a1a] rounded-md h-5 flex items-center px-3">
                      <span className="text-xs text-white/50">
                        {project.url ? project.url.replace(/^https?:\/\//, '') : 'project preview'}
                      </span>
                    </div>
                  </div>
                  
                  <Link href={`/projects/${project.slug}`} className="pt-8 block">
                    {projectLabel && (
                      <h2 className="text-2xl mb-4 font-light">{projectLabel}</h2>
                    )}
                    <Image 
                      src={project.imagePath} 
                      alt={`${project.title} Dashboard`} 
                      width={1920} 
                      height={1080} 
                      className="w-full" 
                    />
                  </Link>
                </div>
              )}

              {/* Project Description */}
              <div className="space-y-6">
                <h2 className="text-2xl mb-4 font-light"> &nbsp; </h2>
                {LogoComponent && project.tagline ? (
                  <span className="leading-relaxed flex items-center gap-2">
                    {LogoComponent}
                    <span className="text-[19px] tracking-[0.122em] font-[100]">
                      {project.tagline}
                    </span>
                  </span>
                ) : LogoComponent ? (
                  <div className="leading-relaxed flex items-center">
                    {LogoComponent}
                  </div>
                ) : (
                  <h2 className="text-2xl font-light">{project.title}</h2>
                )}
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs px-2 py-1 rounded border border-white/20 text-white/60">
                    {project.projectType}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    project.status === 'POC - MVP' 
                      ? 'bg-primary/20 text-primary border border-primary/30'
                      : project.status === 'Planning'
                      ? 'bg-accent-secondary/20 text-accent-secondary border border-accent-secondary/30'
                      : project.status === 'Production'
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                      : project.status === 'Open Source'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : project.status === 'Experiment'
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/10 text-white/60 border border-white/20'
                  }`}>
                    {project.status}
                  </span>
                </div>
                <div className="space-y-4 text-white/80">
                  <p>{project.blurb}</p>
                  {project.techStack && (
                    <p className="text-white/60">Tech Stack: {project.techStack}</p>
                  )}
                  <Link 
                    href={`/projects/${project.slug}`}
                    className="text-primary hover:text-accent-secondary transition-colors inline-block"
                  >
                    Learn more →
                  </Link>
                </div>
              </div>
            </section>

            {/* Horizontal Rule between projects */}
            {index < featuredProjects.length - 1 && (
              <div className="w-full h-px bg-primary/50 mt-16" />
            )}
          </div>
        )
      })}

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

      {/* Contact */}
      <section className="space-y-4 text-center">
        <h2 className="text-2xl font-light">Want to chat?</h2>
        <p className="text-white/80">
          I love ranting. Email me. If you can&apos;t figure that out, you shouldn&apos;t be emailing me.
        </p>
      </section>

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

      {/* Stats Section */}
      <section className="space-y-6">
        {/* GitHub and Activity Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* GitHub Stats */}
          <div className="border rounded-lg p-8 bg-accent/5 space-y-4">
            <div className="flex items-center gap-3">
              <GitHubIcon className="w-6 h-6" />
              <h3 className="text-2xl font-bold">GitHub Activity</h3>
            </div>
            <GitHubStats />
            <GitHubContributions />
          </div>

          {/* Coding Stats */}
          <div className="border rounded-lg p-8 bg-accent/5">
            <CodingStats />
          </div>
        </div>
      </section>
      
    </div>
  )
}

