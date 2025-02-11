'use client'



export default function Error() {
  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
          Error
        </h1>
        <h2 className="mb-8 text-2xl font-semibold text-gray-700 dark:text-gray-300">
          An error occurred
        </h2>
        <p className="mb-8 text-gray-600 dark:text-gray-400">
        Sorry, an error occurred while loading this page.
        </p>
     
      </div>
    </div>
  )
}
