'use client'


export default function NotFound() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          404
        </h1>
        <h2 className="mb-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">
          Page not found
        </h2>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
          Sorry, we couldn&apos;t find the page you&apos;re looking for.
        </p>
       
      </div>
    </div>
  )
}
