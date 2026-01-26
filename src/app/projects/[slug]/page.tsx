import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { projects, type ProjectMeta } from '../data'
import Logo from '@/components/voxlogo'
import TwineLogo from '@/components/twineLogo'

async function getProject(slug: string): Promise<ProjectMeta | null> {
  return projects[slug] || null
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const project = projects[slug]

  if (!project) {
    return {
      title: 'Project Not Found | Aden Tranter',
      description: 'The requested project could not be found.',
    }
  }

  return {
    title: `${project.title} | Aden Tranter`,
    description: project.description || project.blurb,
    alternates: {
      canonical: `https://adentranter.com/projects/${slug}`,
    },
    openGraph: {
      title: `${project.title} | Aden Tranter`,
      description: project.description || project.blurb,
      type: 'website',
      url: `https://adentranter.com/projects/${slug}`,
      images: project.imagePath
        ? [
            {
              url: project.imagePath,
              width: 1200,
              height: 630,
              alt: project.title,
            },
          ]
        : [
            {
              url: '/adentranter.jpg',
              width: 1200,
              height: 630,
              alt: 'Aden Tranter',
            },
          ],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${project.title} | Aden Tranter`,
      description: project.description || project.blurb,
      images: project.imagePath ? [project.imagePath] : ['/adentranter.jpg'],
    },
  }
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const project = await getProject(slug)

  if (!project) {
    notFound()
  }

  const LogoComponent = project.logoComponent === 'voxit' 
    ? Logo 
    : project.logoComponent === 'twine'
    ? TwineLogo
    : null

  return (
    <div className="flex flex-col gap-16 py-16 max-w-6xl mx-auto px-4">
      {/* Back Link */}
      <Link 
        href="/" 
        className="text-white/60 hover:text-primary transition-colors self-start"
      >
        ← Back to home
      </Link>

      {/* Project Header */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          {LogoComponent && (
            <LogoComponent size="lg" />
          )}
          {project.logoImagePath && (
            <Image
              src={project.logoImagePath}
              alt={`${project.title} Logo`}
              width={120}
              height={40}
              className="h-10 w-auto"
            />
          )}
          <div>
            <h1 className="text-4xl sm:text-5xl font-light bg-clip-text text-transparent bg-gradient-to-r from-primary to-accent-secondary">
              {project.title}
            </h1>
            {project.tagline && (
              <p className="text-xl text-white/80 font-light mt-2 tracking-[0.122em]">
                {project.tagline}
              </p>
            )}
          </div>
        </div>
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
        {project.url && (
          <Link 
            href={project.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-primary hover:text-accent-secondary transition-colors"
          >
            {project.url.replace(/^https?:\/\//, '')} →
          </Link>
        )}
      </section>

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

      {/* Project Screenshot */}
      {project.imagePath && (
        <section>
          <div className="relative aspect-video rounded-lg overflow-hidden bg-[#1a1a1a] shadow-xl">
            {/* Browser Chrome */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-[#2a2a2a] flex items-center px-4 gap-2 z-10">
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
            
            <div className="pt-8">
              <Image 
                src={project.imagePath} 
                alt={`${project.title} Dashboard`} 
                width={1920} 
                height={1080} 
                className="w-full"
              />
            </div>
          </div>
        </section>
      )}

      {/* Horizontal Rule */}
      <div className="w-full h-px bg-primary/50" />

      {/* Project Description */}
      <section className="space-y-6">
        <h2 className="text-2xl font-light">About</h2>
        <div className="space-y-4 text-white/80 leading-relaxed">
          <p className="text-lg">{project.blurb}</p>
          {project.update && (
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-xl font-light mb-3">Current Status</h3>
              <p>{project.update}</p>
            </div>
          )}
        </div>
      </section>

      {/* Tech Stack */}
      {project.techStack && (
        <>
          <div className="w-full h-px bg-primary/50" />
          <section>
            <h2 className="text-2xl font-light mb-4">Tech Stack</h2>
            <p className="text-white/60">{project.techStack}</p>
          </section>
        </>
      )}
    </div>
  )
}

