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
    description: 'IT business ticket and invoicing management system.',
    blurb: 'Helping manage an IT business\'s ticket and invoicing system, streamlining operations from ticket creation to invoice generation. Hosted internally with robust redundancy and backup schemes, integrated with Office365 and Xero for seamless workflow automation.',
    update: 'Heavily used production system with 20+ daily active users. Managing IT service tickets and automating invoicing workflows with continuous updates deployed via internally controlled CI/CD. Built on PostgreSQL with integrations to Office365 and Xero, ensuring reliable operations with comprehensive backup and redundancy.',
    techStack: 'Next.js, React, PostgreSQL, Office365, Xero',
    featured: true,
    imagePath: '/screenshots/mission-control.jpg', // Placeholder - user will add image
    logoImagePath: '/logos/mission-control-logo.png', // Placeholder - user will add logo
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

