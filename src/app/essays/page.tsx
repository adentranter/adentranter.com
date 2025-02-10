import { promises as fs } from 'fs'
import path from 'path'
import Link from 'next/link'
import Image from 'next/image'

async function getEssays() {
  const essaysDirectory = path.join(process.cwd(), 'src/app/essays/essay-files')
  const files = await fs.readdir(essaysDirectory)
  
  const essays = await Promise.all(
    files.map(async (filename) => {
      const filePath = path.join(essaysDirectory, filename)
      const content = await fs.readFile(filePath, 'utf8')
      return JSON.parse(content)
    })
  )

  return essays.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
}

export default async function EssaysPage() {
  const essays = await getEssays()

  return (
    <div className="max-w-2xl mx-auto py-16 px-4">
      
      <h1 className="text-3xl font-bold mb-8">Essays</h1>
      <hr className="my-8 border-t border-white/10" />

      <div className="space-y-8">
        {essays.map((essay) => (
          <article key={essay.slug} className="border-b border-gray-200 pb-8">
            <Link 
              href={`/essays/${essay.slug}`}
              className="block group"
            >
              <h2 className="text-xl font-semibold group-hover:text-blue-600 transition-colors">
                {essay.title}
              </h2>
              <time className="text-sm text-gray-500 mt-2 block">
                {new Date(essay.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </time>
            </Link>
          </article>
        ))}
      </div>
    </div>
  )
}
