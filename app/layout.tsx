import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";
import { ProgressSyncProvider } from "@/components/providers/ProgressSyncProvider";

import { siteConfig } from "@/config/site";
import { fontSans } from "@/config/fonts";
import { Navbar } from "@/components/navbar";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          <ProgressSyncProvider>
            <div className="relative flex flex-col h-screen">
              <Navbar />
              <main className="flex-grow overflow-hidden">
                {children}
              </main>
              <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 z-20">
                <div className="flex items-center justify-between px-6 py-2 text-sm">
                  <div className="flex items-center gap-4 text-white/70">
                    <span>© 2024 G-Bax</span>
                    <span>•</span>
                    <span>Blockchain Space Exploration</span>
                  </div>
                  <div className="flex items-center gap-1 text-white/70">
                    <span>Powered by</span>
                    <Link
                      isExternal
                      className="text-primary hover:text-primary/80 transition-colors"
                      href="https://honeycomb.gg"
                    >
                      Honeycomb Protocol
                    </Link>
                    <span>•</span>
                    <Link
                      isExternal
                      className="text-secondary hover:text-secondary/80 transition-colors"
                      href="https://verxio.com"
                    >
                      Verxio
                    </Link>
                  </div>
                </div>
              </footer>
            </div>
          </ProgressSyncProvider>
        </Providers>
      </body>
    </html>
  );
}
