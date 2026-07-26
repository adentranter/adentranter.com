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
  byline?: string
  audience?: string
  logoComponent?: 'voxit' | 'twine'
  logoImagePath?: string
  projectType: 'Company' | 'Desk Job' | 'Open Source' | 'Experiment'
  status: 'POC - MVP' | 'Planning' | 'Dead in the water' | 'Production' | 'Open Source' | 'Experiment'
}

export type HomepageBrandKey =
  | 'voxit'
  | 'legal-lookup'
  | 'founder-agreements'
  | 'launchos'
  | 'mail-your-mp'

export type HomepageProject = {
  slug: HomepageBrandKey
  /** Tailwind classes for the card shell background. */
  cardClassName: string
}

export const projects: Record<string, ProjectMeta> = {
  voxit: {
    slug: 'voxit',
    title: 'Voxit',
    description: 'Transcript proofreading; binding text and audio for easy proofreading.',
    blurb:
      'Audio-linked editing for Australian court transcription — less rewinding, less reformatting, more billable hours. Text and audio stay bound so you can verify and fix lines without losing the thread.',
    update: 'Currently in active development with continuous improvements to transcription accuracy and proofreading capabilities.',
    url: 'https://voxit.com.au',
    imagePath: '/screenshots/voxit.png',
    techStack: 'Next.js, React, Supabase, Tauri',
    featured: true,
    tagline: 'Transcript proofreading',
    byline: 'Finish transcripts faster. Get paid more per hour.',
    audience: 'Australian court transcriptionists and agencies who need audio-linked editing, less rewinding, and more billable hours.',
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
  'founder-agreements': {
    slug: 'founder-agreements',
    title: 'Founder Config',
    description: 'From handshake to a documented deal — configure roles, equity, control, and vesting.',
    blurb:
      'Answer a short smart intake — roles, equity, control, and vesting fill in from sensible defaults — then copy a plain-English term sheet for your lawyer. Not legal advice; an opinionated fairness configurator.',
    url: 'https://founderagreements.adentranter.com/',
    imagePath: '/screenshots/founder-agreements.jpg',
    techStack: 'Next.js, React',
    featured: true,
    tagline: 'Handshake to agreement',
    byline: 'From handshake to a documented deal.',
    audience: 'Co-founders and early teams who need a clear, fair starting deal before lawyers draft the paperwork.',
    projectType: 'Experiment',
    status: 'Production',
  },
  launchos: {
    slug: 'launchos',
    title: 'LaunchOS',
    description: 'A guided launch engine for Australian businesses — one profile, one workflow, one dashboard.',
    blurb:
      'One profile, one workflow, one dashboard — from idea through setup to first payment, without juggling half a dozen government and accounting tabs.',
    url: 'https://launchos.adentranter.com',
    techStack: 'Next.js, React, Prisma',
    featured: true,
    tagline: 'From idea to first payment.',
    byline: 'From idea to first payment.',
    audience: 'Australian founders launching a new business who want a guided path instead of a checklist scavenger hunt.',
    projectType: 'Company',
    status: 'POC - MVP',
  },
  'mail-your-mp': {
    slug: 'mail-your-mp',
    title: 'Mail Your MP',
    description: 'Join an issue. We send a real, physical letter to your MP on your behalf.',
    blurb:
      "Pick an issue, we figure out who's responsible, and send a physical letter to your MP for you — one person, one letter, one politician.",
    url: 'https://mailyourmp.com.au',
    imagePath: '/screenshots/mail-your-mp.png',
    techStack: 'Next.js, React',
    featured: true,
    tagline: 'Physical letters to your MP',
    byline: 'Sick of waiting? Mail your MP.',
    audience:
      "Australians who want a real letter on an issue to land on their MP's desk — without writing, printing, or posting it themselves.",
    projectType: 'Experiment',
    status: 'Production',
  },
  'legal-lookup': {
    slug: 'legal-lookup',
    title: 'Legal Lookup',
    description: 'Australian legal information lookup.',
    blurb:
      'Search Australian laws, courts, judges, and courthouses in one place — without the usual maze of PDFs, fragmented portals, and dead ends.',
    url: 'https://legallookup.com.au',
    techStack: 'Next.js, React',
    featured: true,
    tagline: 'Australian legal search',
    byline: 'Search Australian laws, courts, judges, and courthouses in one place.',
    audience: 'Researchers, solicitors, and curious citizens who need Australian legal information without hunting PDFs and dead ends.',
    projectType: 'Experiment',
    status: 'POC - MVP',
  },
  'mission-control': {
    slug: 'mission-control',
    title: 'Mission Control',
    description: 'Operations and service management platform for an MSP.',
    blurb: 'A management platform for an MSP—the sort of system I build in my day job: work in flight, customers, and the internal glue that keeps a services business running. Not a public product.',
    update: 'An actively used internal platform supporting business operations. Continuously evolving to improve efficiency, reduce manual work, and keep things running smoothly — without making a big deal about it.',
    techStack: 'Next.js, React, PostgreSQL',
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

export const homepageProjects: HomepageProject[] = [
  {
    slug: 'voxit',
    cardClassName:
      'border-[#8B1C2C]/35 bg-gradient-to-br from-[#2a1218] via-[#1a0f14] to-[#12161f]',
  },
  {
    slug: 'legal-lookup',
    cardClassName:
      'border-[#0f96b8]/35 bg-gradient-to-br from-[#082a59]/80 via-[#0a1f3a] to-[#0d2430]',
  },
  {
    slug: 'founder-agreements',
    cardClassName:
      'border-[#2f6fe0]/30 bg-gradient-to-br from-[#15233a] via-[#121a2a] to-[#0f1f1c]',
  },
  {
    slug: 'launchos',
    cardClassName:
      'border-[#0f9f6e]/35 bg-gradient-to-br from-[#0f1f28] via-[#12241f] to-[#132033]',
  },
  {
    slug: 'mail-your-mp',
    cardClassName:
      'border-[#F7AF02]/30 bg-gradient-to-br from-[#004A31]/90 via-[#0a2a20] to-[#121a16]',
  },
]
