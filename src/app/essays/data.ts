export interface EssayMeta {
  slug: string
  title: string
  date: string
  excerpt: string
  listed?: boolean
  contentPath: string
}

export const essays: Record<string, EssayMeta> = {
  thefool: {
    slug: 'thefool',
    title: 'On being the fool, or how to probably change the world',
    date: '2025-09-28',
    excerpt:
      'Why accepting the sting of looking like a fool is the entry price for meaningful change, and how conviction keeps you in the game long enough to matter.',
    contentPath: 'src/app/essays/content/thefool.md',
  },
  'critical-systems-revisited': {
    slug: 'critical-systems-revisited',
    title: 'Critical Systems Revisited',
    date: '2025-03-20',
    excerpt:
      "A reflection on why critical systems often fail while consumer platforms remain reliable, exploring the impact of organizational structure and company culture on system resilience.",
    contentPath: 'src/app/essays/content/critical-systems-revisited.md',
  },
  'charity-philosophy': {
    slug: 'charity-philosophy',
    title: "Why I'm not donating to your charity, or my personal philosophy on how to ethically run companies.",
    date: '2024-12-25',
    excerpt:
      'An exploration of charity models, business ethics, and why the traditional charity approach might not be the most effective way to create lasting positive change.',
    contentPath: 'src/app/essays/content/charity-philosophy.md',
  },
  'cutting-boards-need-feet': {
    slug: 'cutting-boards-need-feet',
    title: 'Cutting boards need feet, or why being a purist and pragmatic are mutually exclusive',
    date: '2025-01-01',
    excerpt:
      'An exploration of the tension between purism and pragmatism through the lens of cutting board design, and why sometimes compromising on ideals leads to better outcomes.',
    contentPath: 'src/app/essays/content/cutting-boards-need-feet.md',
  },
  'teaching-in-context': {
    slug: 'teaching-in-context',
    title:
      "Teaching in context works, or why the best learning is when you think you aren't being taught",
    date: '2025-01-15',
    excerpt:
      'An exploration of how contextual learning and creative engagement could transform education, using the evolution of spell-checking as a lens to understand deeper truths about how we learn.',
    contentPath: 'src/app/essays/content/teaching-in-context.md',
  },
  'being-happy': {
    slug: 'being-happy',
    title: 'Being Happy, or How to Probably Be a Pragmatic Leader',
    date: '2025-04-01',
    excerpt:
      'An exploration of how perspective and zoom levels affect leadership and happiness, arguing that effective leadership requires mastering the art of shifting focus between different levels of detail.',
    contentPath: 'src/app/essays/content/being-happy.md',
  },
  'how-david-beats-goliath': {
    slug: 'how-david-beats-goliath',
    title: 'How David Beats Goliath: A Playbook for QuickBooks Gaining Market Share in Australia',
    date: '2025-07-10',
    excerpt:
      "A field report on building with QuickBooks APIs in Australia, exploring how developer experience and listening to users could help QuickBooks gain market share against larger competitors.",
    contentPath: 'src/app/essays/content/how-david-beats-goliath.md',
  },
}
