export type DistractionSlug = 'photos' | 'woodworking' | 'music'

export interface DistractionCategory {
  slug: DistractionSlug
  title: string
  description: string
  status: 'active' | 'coming-soon'
  coverImage?: string
  coverImagePosition?: 'top' | 'center'
}

export type PhotoLayout = 'default' | 'large' | 'featured-left' | 'featured-bottom'

export interface DistractionPhoto {
  id: string
  category: DistractionSlug
  imagePath: string
  alt: string
  title?: string
  caption?: string
  date: string
  layout?: PhotoLayout
}

export const distractionCategories: DistractionCategory[] = [
  {
    slug: 'photos',
    title: 'my photos',
    description: 'Random shots from life — landscapes, moments, and things worth keeping.',
    status: 'active',
    coverImagePosition: 'top',
  },
  {
    slug: 'woodworking',
    title: 'woodworking',
    description: 'Projects, joints, and sawdust — things built with hands and patience.',
    status: 'active',
    coverImage: '/distractions/woodworking/blackwood-desk.jpg',
  },
  {
    slug: 'music',
    title: 'music',
    description: "What I'm listening to lately — scrobbled from home, not Spotify.",
    status: 'active',
  },
]

export const FLICKR_PHOTOS_URL = 'https://www.flickr.com/photos/30880553@N03/'

/** Filename stem (before Flickr id) → optional display title. Order is preserved. */
export const featuredPhotoPicks: Array<{
  stem: string
  title?: string
  layout?: PhotoLayout
}> = [
  { stem: 'afternoon-ritual', title: 'afternoon rural', layout: 'featured-left' },
  { stem: 'a-light-in-the-dark' },
  { stem: 'me-and-my-room', title: 'where it all begun' },
  { stem: '2-face' },
  { stem: 'me' },
  { stem: 'mocked-by-water' },
  { stem: 'put-some-windex-on-it' },
  { stem: 'boats-do-gang-up-against-other-boats', title: 'boats do gang up against other boats' },
  { stem: 'going-home', layout: 'large' },
  { stem: 'diving', layout: 'featured-bottom' },
]

/** Filename stem → optional display title. Order is preserved. */
export const featuredWoodworkingPicks: Array<{
  stem: string
  title?: string
  layout?: PhotoLayout
}> = [
  { stem: 'blackwood-desk', title: 'blackwood desk' },
  { stem: 'bedroom-suite', title: 'bedroom suite' },
  { stem: 'lounge', title: 'lounge' },
  { stem: 'bathroom-suite', title: 'bathroom suite' },
  { stem: 'handcut-dovetails-box', title: 'hand-cut dovetails box' },
  { stem: 'coin-cabinet', title: 'coin cabinet' },
  { stem: 'african-mah-table', title: 'african mahogany table' },
  { stem: 'coffeetable', title: 'coffee table' },
  { stem: 'record-stand-player', title: 'record stand & player' },
  { stem: 'maple-sikly-bathroom-cabinet', title: 'maple & silky oak bathroom cabinet' },
  { stem: 'bathroom-caddy', title: 'bathroom caddy' },
  { stem: 'shelf_and_light', title: 'shelf and light' },
  { stem: 'sound-conditioning', title: 'sound conditioning' },
  { stem: 'carving', title: 'carving' },
  { stem: 'volin-case', title: 'violin case' },
]

export function getCategory(slug: DistractionSlug): DistractionCategory | undefined {
  return distractionCategories.find((category) => category.slug === slug)
}
