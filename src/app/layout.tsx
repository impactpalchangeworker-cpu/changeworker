import "./globals.css"
import type { Metadata, Viewport } from "next"
import { AuthProvider } from "@/context/AuthContext"
import { SearchProvider } from "@/context/SearchContext"
import { Toaster } from "react-hot-toast"
// import PWARegistrar from "@/components/pwa/PWARegistrar"
// import PWAInstallPrompt from "@/components/pwa/PWAInstallPrompt"
import CsrfFetchGuard from "@/components/platform/CsrfFetchGuard"
import UsageCookieTracker from "@/components/platform/UsageCookieTracker"
import CookieBootstrap from "@/components/platform/CookieBootstrap"
import CookieConsentBanner from "@/components/platform/CookieConsentBanner"

export const metadata: Metadata = {
  title: "changeworker",
  description: "Freelance Engine for Changemakers",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "changeworker",
  },
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
}

export const viewport: Viewport = {
  themeColor: "#f97316",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-white text-gray-900">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontSize: "14px",
            },
          }}
        />
        <AuthProvider>
          <SearchProvider>
            {/* <PWARegistrar /> */}
            {/* <PWAInstallPrompt /> */}
            <CookieBootstrap />
            <CookieConsentBanner />
            <CsrfFetchGuard />
            <UsageCookieTracker />
            <div className="min-h-screen flex flex-col">
              <header className="border-b" style={{ borderColor: "var(--border)" }} />
              <main className="flex-1 overflow-x-hidden bg-transparent">{children}</main>
            </div>
          </SearchProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
