export interface ProjectMeta {
  slug: string
  title: string
  description: string
  blurb: string
  update?: string
  url?: string
  imagePath?: string
  techStack?: string
  featured: boolean
  tagline?: string
  logoComponent?: 'voxit' | 'twine'
  logoImagePath?: string
  projectType: 'Company' | 'Desk Job' | 'Open Source' | 'Experiment'
  status: 'POC - MVP' | 'Planning' | 'Dead in the water' | 'Production' | 'Open Source' | 'Experiment'
}

export const projects: Record<string, ProjectMeta> = {
  voxit: {
    slug: 'voxit',
    title: 'Voxit',
    description: 'AI-Powered, Human Perfected transcription at the speed of thought.',
    blurb: 'Transcription at the Speed of Thought - Faster, Cheaper, Better. Using WhisperX and LLaMA, we transcribe and proofread your audio files.',
    update: 'Currently in active development with continuous improvements to transcription accuracy and proofreading capabilities.',
    url: 'https://voxit.com.au',
    imagePath: '/screenshots/voxit.png',
    techStack: 'Next.js, React, Supabase, Tauri',
    featured: true,
    tagline: 'AI-Powered, Human Perfected',
    logoComponent: 'voxit',
    projectType: 'Company',
    status: 'POC - MVP',
  },
  twine: {
    slug: 'twine',
    title: 'Twine',
    description: 'Connect. Invoice. Automate.',
    blurb: 'Seamlessly link Employment Hero with QuickBooks, automatically generating invoices at payroll time - so you never miss a charge or waste time on manual invoicing.',
    update: 'Twine was a good product, but it existed within a domain I know nothing about—accounting and bookkeeping. Once the product was 80% complete, my 50% of the company was revoked (it was not formalized yet). All connected accounts were in a Google account that got locked down with 2FA, and the site was turned off as an overseas company started a remake. The lesson: be convicted enough in your product that you formalize the company fast, and only start companies with people you have known for at least 5 years. But the deeper lesson: you need to be your own user. When you\'re building something in a domain you don\'t understand, you can\'t defend the product\'s direction with conviction. This project taught me that hard lesson.',
    url: 'https://twinebiller.com.au',
    imagePath: '/screenshots/twine.png',
    techStack: 'Next.js, React, Supabase, Trigger.dev',
    featured: true,
    logoComponent: 'twine',
    projectType: 'Company',
    status: 'Dead in the water',
  },
  'ivf-journey': {
    slug: 'ivf-journey',
    title: 'IVF Journey',
    description: 'IVF treatment management, aligned around every patient.',
    blurb: 'Give your clinics, coordinators, and patients a single source of truth—from intake through post-transfer support—with reliable reminders, plan tracking, and real-time updates.',
    update: 'A project I\'m working on with my sister, who went through IVF and is still going through it. This is a domain I understand intimately through her experience, making it a project built with real conviction and understanding of the problem.',
    url: 'https://myivfjourney.com.au',
    imagePath: '/screenshots/ivf-journey.jpg', // Placeholder - user will add image
    techStack: 'Next.js, React, Supabase',
    featured: true,
    projectType: 'Experiment',
    status: 'POC - MVP',
  },
  'mission-control': {
    slug: 'mission-control',
    title: 'Mission Control',
    description: 'Internal system for managing service operations.',
    blurb: 'A deliberately understated system that handles the day-to-day chaos of running an IT services business — from tracking work to keeping things moving.',
    update: 'An actively used internal platform supporting business operations. Continuously evolving to improve efficiency, reduce manual work, and keep things running smoothly — without making a big deal about it.',
    techStack: 'Next.js, React, PostgreSQL',
    url:'behind firewall ;)',
    featured: true,
    imagePath: '/screenshots/mission-control.jpg',
    logoImagePath: '/logos/mission-control-logo.png',
    projectType: 'Desk Job',
    status: 'Production',
  },
  'base-crm': {
    slug: 'base-crm',
    title: 'Base CRM',
    description: 'Foundation CRM system that forms the base for specialized business solutions.',
    blurb: 'A flexible base CRM system designed to be the foundation for specialized business solutions. Currently being used as the foundation for a woodworking shop booking system, a CRM+POS system, and a go-kart track timing and booking system.',
    update: 'In early development - building the core CRM functionality that will power multiple specialized business applications.',
    techStack: 'Next.js, React, Supabase',
    featured: false, // Not shown on homepage
    imagePath: '/screenshots/base-crm.png', // Placeholder - user will add image
    projectType: 'Company',
    status: 'Planning',
  },
}

