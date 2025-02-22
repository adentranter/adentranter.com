import Image from "next/image";
import Link from "next/link";
import { GitHubIcon } from '@/components/icons'
import { GitHubContributions } from '@/components/github-contributions'
import { CodingStats } from '@/components/coding-stats'
import Logo from "@/components/voxlogo";
import { GitHubStats } from '@/components/github-stats'
import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Aden Tranter - Software Engineer & Problem Solver',
  description: 'Software engineer specializing in solving unique problems through code and curiosity. Featuring projects like Voxit, real-time transcription technology.',
  keywords: ['software engineer', 'web development', 'transcription technology', 'Voxit', 'real-time transcription'],
  openGraph: {
    title: 'Aden Tranter - Software Engineer & Problem Solver',
    description: 'Software engineer specializing in solving unique problems through code and curiosity.',
    type: 'website',
    url: 'https://adentranter.com', // Replace with your actual domain
    images: [
      {
        url: '/adentranter.jpg', // Replace with your actual OG image path
        width: 1200,
        height: 630,
        alt: 'Aden Tranter',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aden Tranter - Software Engineer & Problem Solver',
    description: 'Software engineer specializing in solving unique problems through code and curiosity.',
    images: ['/adentranter.jpg'], // Replace with your actual Twitter card image path
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
          I dig too deep into how things work, build solutions for problems you didn&apos;t know you had, and occasionally make something useful
        </p>
      </section>

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />
      {/* Featured Work + Description Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-12">
       
        {/* Voxit Screenshot */}
        <div className="relative aspect-video rounded-lg overflow-hidden">
          {/* Browser Chrome */}
          <Link href="/projects/voxit" className="pt-8">
            <Image
              src="/screenshots/voxit.png"
              alt="Voxit Dashboard"
              width={1920}
              height={1080}
              className="w-full"
            />
          </Link>
        </div>

        {/* Voxit Description */}
        <div className="space-y-6">
        <h2 className="text-2xl font-light mr-10 pr-10 "> Current Project:
          <Logo size="lg" /></h2>
          <h2 className="text-2xl font-light">Customisable, verbatim transcripts—delivered in real time.
          </h2>
          <div className="space-y-4 text-white/80">
            <p>
              Leading innovation in voice transcription technology with AI-driven, real-time transcripts. 
              Our hybrid approach combines cutting-edge tech with expert human editors—delivering 
              superior quality at lower costs.
            </p>
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

      {/* CTA Section */}
      <section className="text-center space-y-6 py-16">
        <h2 className="text-3xl font-bold">Let&apos;s Talk Ideas Over Coffee</h2>
        <p className="text-white/80 max-w-xl mx-auto">
          Every week, I dedicate one full day to meeting new people and sharing ideas. 
          Whether you&apos;re interested in tech, ethical business, or just want to chat about 
          craftsmanship - I&apos;d love to connect.
        </p>
        <Link 
          href="mailto:adentranter@gmail.com"
          className="inline-block px-6 py-3 rounded-full bg-primary text-background-dark font-medium hover:bg-primary/90 transition-colors"
        >
          Book a Coffee Chat
        </Link>
      </section>

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

    </div>
  );
}
