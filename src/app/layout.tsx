import { Fraunces, Inter } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import AppFrame from "@/components/layout/app-frame"
import FireflyCursor from "@/components/layout/firefly-cursor"
import { Analytics } from "@vercel/analytics/react"
import Script from "next/script"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
})

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
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
  const GA_ID = process.env.NEXT_PUBLIC_GA_ID
  const enableGA = process.env.NODE_ENV === 'production' && !!GA_ID
  const enableUmami = process.env.NODE_ENV === 'production'
  return (
    <html lang="en" suppressHydrationWarning>
      {enableGA && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="gtag-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
              });
            `}
          </Script>
        </>
      )}
      {enableUmami && (
        <Script
          defer
          src="https://analytics.adentranter.com/script.js"
          data-website-id="0f5ab51f-333b-405e-b3ee-d5471864cce2"
          strategy="afterInteractive"
        />
      )}
      <body
        className={`${inter.variable} ${fraunces.variable} font-sans bg-background dark:bg-background-dark min-h-screen antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          disableTransitionOnChange
        >
          <FireflyCursor />
          <AppFrame>
            {children}
          </AppFrame>
        </ThemeProvider>
        <Analytics/>
      </body>
    </html>
  )
}
