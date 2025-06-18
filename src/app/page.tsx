import Image from "next/image"
import Link from "next/link"
import { GitHubIcon } from "@/components/icons"
import { GitHubContributions } from "@/components/github-contributions"
import { CodingStats } from "@/components/coding-stats"
import Logo from "@/components/voxlogo"
import TwineLogo from "@/components/twineLogo"
import { GitHubStats } from "@/components/github-stats"
import type { Metadata } from "next"

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
      {/* Featured Work + Description Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Voxit Screenshot */}
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
              <span className="text-xs text-white/50">https://voxit.com.au</span>
            </div>
          </div>
          
          <Link href="https://voxit.com.au" className="pt-8">
          <h2 className="text-2xl mb-4 font-light">Primary Project</h2>

            <Image src="/screenshots/voxit.png" alt="Voxit Dashboard" width={1920} height={1080} className="w-full" />
          </Link>
        </div>

        {/* Voxit Description */}
        <div className="space-y-6">

        <h2 className="text-2xl mb-4 font-light"> &nbsp; </h2>
        <span className="leading-relaxed"> <Logo size="lg" />  <span className="text-[19px] ml-2 tracking-[0.122em] font-[100] ">AI-Powered, Human Perfected</span></span>
          <div className="space-y-4 text-white/80">
            <p>
Transcription at the Speed of Thought - Faster, Cheaper, Better.<br/> <br/> Using WhisperX and LLaMA, we transcribe and proofread your audio files.      </p>
            <p className="text-white/60">Tech Stack: Next.js, React, Supabase, Tauri</p>
          </div>
        </div>
      </section>

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

      {/* Second Project - Twine */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Twine Screenshot */}
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
              <span className="text-xs text-white/50">https://twinebiller.com.au</span>
            </div>
          </div>
          
          <Link href="https://twinebiller.com.au" className="pt-8">
          <h2 className="text-2xl mb-4 font-light">Secondary Project</h2>

            <Image src="/screenshots/twine.png" alt="Twine Dashboard" width={1920} height={1080} className="w-full" />
          </Link>
        </div>

        {/* Twine Description */}
        <div className="space-y-6">
          <h2 className="text-2xl mb-4 font-light"> &nbsp; </h2>
          <span className="leading-relaxed"> <TwineLogo size="large" />  <span className="text-[19px] ml-2 tracking-[0.122em] font-[100] ">Connect. Invoice. Automate.</span></span>
          <div className="space-y-4 text-white/80">
            <p>
              Seamlessly link Employment Hero with QuickBooks, automatically generating invoices at payroll time - so you never miss a charge or waste time on manual invoicing.
            </p>
            <p className="text-white/60">Tech Stack: Next.js, React, Supabase, Trigger.dev</p>
          </div>
        </div>
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

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

      {/* Community Section */}
      <section className="text-center space-y-6 py-16">
        <h2 className="text-3xl font-bold">Join the QLD Technical Founders Slack</h2>
        <p className="text-white/80 max-w-xl mx-auto">
          Building apps, software, and solving cool problems gets easier when you have a community behind you. I'm
          kicking-off a brand-new (read: <em>very</em> early-stage) Slack space for technical—and technical-curious—founders
          across Queensland. The goal: swap stories, road-test ideas, share product-management tips, and generally help
          each other ship better software.
        </p>
        <p className="text-white/70 max-w-xl mx-auto">
          If that sounds like your jam (or you just want some like-minded folks to geek out with), jump in and help shape
          the community from day one.
        </p>
        <Link
          href="https://join.slack.com/t/technicalfoun-2t44634/shared_invite/zt-37eegb8vp-zOqGT7d9aLgWVyuv7rdKNQ"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-background-dark font-medium hover:bg-primary/90 transition-colors"
        >
          {/* Slack Icon */}
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 122.8 122.8" aria-hidden="true">
            <path d="M30.3 77.7a15.2 15.2 0 1 1-15.2-15.2h15.2v15.2z" fill="#E01E5A"/>
            <path d="M37.9 77.7a15.2 15.2 0 1 1 30.3 0v37.9a15.2 15.2 0 1 1-30.3 0V77.7z" fill="#E01E5A"/>
            <path d="M45.4 30.3a15.2 15.2 0 1 1-15.2-15.2 15.2 15.2 0 0 1 15.2 15.2z" fill="#36C5F0"/>
            <path d="M45.4 37.9a15.2 15.2 0 1 1 0 30.3H7.5a15.2 15.2 0 1 1 0-30.3h37.9z" fill="#36C5F0"/>
            <path d="M92.9 45.4a15.2 15.2 0 1 1 15.2-15.2v15.2H92.9z" fill="#2EB67D"/>
            <path d="M85.4 45.4a15.2 15.2 0 1 1-30.3 0V7.5a15.2 15.2 0 1 1 30.3 0v37.9z" fill="#2EB67D"/>
            <path d="M77.8 92.9a15.2 15.2 0 1 1 15.2 15.2 15.2 15.2 0 0 1-15.2-15.2z" fill="#ECB22E"/>
            <path d="M77.8 85.4a15.2 15.2 0 1 1 0-30.3h37.9a15.2 15.2 0 1 1 0 30.3H77.8z" fill="#ECB22E"/>
          </svg>
          Join the Slack Community
        </Link>
        <p className="text-white/60 text-sm mt-4">
          Prefer email? You can reach me at <a href="mailto:adentranter@gmail.com" className="underline hover:text-white">adentranter@gmail.com</a>
        </p>
      </section>

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />
    </div>
  )
}

