import { notFound } from "next/navigation"
import { essays } from "@/app/essays/data"

// Define the params type
type PageParams = {
  slug: string
}

// Define the props type
type PageProps = {
  params: PageParams
  searchParams: { [key: string]: string | string[] | undefined }
}

// Metadata generator
export async function generateMetadata({ params }: PageProps) {
  const essay = essays[params.slug as keyof typeof essays]

  if (!essay) {
    return {
      title: "Essay Not Found",
    }
  }

  return {
    title: `${essay.title}`,
    description: essay.content.substring(0, 160),
  }
}

// Static params for Next.js
export function generateStaticParams(): PageParams[] {
  return Object.keys(essays).map((slug) => ({
    slug,
  }))
}

export default function Page({ params }: PageProps) {
  const essay = essays[params.slug as keyof typeof essays]

  if (!essay) {
    notFound()
  }

  return (
    <article className="max-w-2xl mx-auto py-16 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{essay.title}</h1>
        <hr className="my-8 border-t border-white/10" />

        <time className="text-sm text-gray-500">
          {new Date(essay.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
      </header>
      <div className="prose prose-lg">
        {essay.content.split("\n\n").map((paragraph: string, index: number) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  )
}

