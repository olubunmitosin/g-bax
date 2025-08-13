import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import { Link } from "@heroui/link";
import clsx from "clsx";

import { Providers } from "./providers";

import { ProgressSyncProvider } from "@/components/providers/ProgressSyncProvider";
import { InitializationProvider } from "@/components/providers/InitializationProvider";
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
    <html suppressHydrationWarning lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Enhanced console suppression for cleaner development experience
              const originalWarn = console.warn;
              const originalError = console.error;
              const originalLog = console.log;

              console.warn = function(...args) {
                const message = args.join(' ');
                // Suppress wallet adapter warnings
                if (message.includes('solflare-detect-metamask') ||
                    message.includes('Unknown response id') ||
                    message.includes('wallet-adapter') ||
                    message.includes('Failed to award on-chain') ||
                    message.includes('Failed to record guild')) {
                  return;
                }
                originalWarn.apply(console, args);
              };

              console.error = function(...args) {
                const message = args.join(' ');
                // Suppress non-critical blockchain errors
                if (message.includes('Failed to create') && message.includes('honeycomb') ||
                    message.includes('Primary assembler config creation failed') ||
                    message.includes('Failed to use existing assembler config')) {
                  return;
                }
                originalError.apply(console, args);
              };

              // Suppress verbose logging in production
              if (window.location.hostname !== 'localhost') {
                console.log = function(...args) {
                  const message = args.join(' ');
                  // Only show important logs in production
                  if (message.includes('successfully') ||
                      message.includes('completed') ||
                      message.includes('Error:') ||
                      message.includes('Warning:')) {
                    originalLog.apply(console, args);
                  }
                };
              }
            `,
          }}
        />
      </head>
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontSans.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark", forcedTheme: "dark", enableSystem: false }}>
          <ProgressSyncProvider>
            <InitializationProvider>
              <div className="relative flex flex-col h-screen">
                <Navbar />
                <main className="flex-grow overflow-hidden">{children}</main>
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
            </InitializationProvider>
          </ProgressSyncProvider>
        </Providers>
      </body>
    </html>
  );
}
