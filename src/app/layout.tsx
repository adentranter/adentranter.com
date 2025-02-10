import { Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Navbar } from "@/components/layout/navbar"
import "./globals.css"

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
  display: 'swap',
})
export const metadata = {
  title: "Aden Tranter | Townsville, QLD | types characters",
  description: "Critical Thinking | Essays on capitalism | Hypotheticals | incorrect placement of caplital letters.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} font-sans bg-background dark:bg-background-dark min-h-screen antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="container flex-grow">
              {children}
            </main>
            <footer className="text-center space-y-2 text-sm text-white/50 font-light py-8 border-t border-white/10">
              <p className="flex items-center justify-center gap-1.5">
                Strategically placed footer text because UX research says you'll trust me more
              </p>
              <p className="flex items-center justify-center gap-1.5 text-xs">
                Crafted with <span className="text-red-400">❤️</span> from Townsville 
                <span className="text-xs">(because apparently that makes it more authentic)</span>
              </p>
              <p className="text-xs italic">
                * Studies show footers with hearts increase conversion by 0% but we do it anyway
              </p>
            </footer>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
