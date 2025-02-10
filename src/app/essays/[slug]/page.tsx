import { promises as fs } from 'fs'
import path from 'path'
import { notFound } from 'next/navigation'

async function getEssay(slug: string) {
  try {
    const essaysDirectory = path.join(process.cwd(), 'src/app/essays/essay-files')
    const filePath = path.join(essaysDirectory, `${slug}.json`)
    const content = await fs.readFile(filePath, 'utf8')
    return JSON.parse(content)
  } catch (_error) {
    return null
  }
}

export default async function EssayPage({
  params
}: {
  params: { slug: string }
}) {
  const essay = await getEssay(params.slug)

  if (!essay) {
    notFound()
  }

  return (
    <article className="max-w-2xl mx-auto py-16 px-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-4">{essay.title}</h1>
        <hr className="my-8 border-t border-white/10" />

        <time className="text-sm text-gray-500">
          {new Date(essay.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          })}
        </time>
      </header>
      <div className="prose prose-lg">
        {essay.content.split('\n\n').map((paragraph: string, index: number) => (
          <p key={index} className="mb-4">
            {paragraph}
          </p>
        ))}
      </div>
    </article>
  )
}
