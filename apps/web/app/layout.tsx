import "./globals.css";
import { AppShell } from "../components/app-shell";
import Script from "next/script";
import { ThemeProvider } from "../components/theme/ThemeProvider";

export const metadata = {
  title: "Khal v0.1",
  description: "Decision operating system over local SQLite"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark" data-theme-preference="system" suppressHydrationWarning>
      <head>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        <Script
          id="khal-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('khal.theme.preference');
                  var preference = stored === 'light' || stored === 'dark' || stored === 'system' ? stored : 'system';
                  var resolved = preference === 'system'
                    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
                    : preference;
                  document.documentElement.dataset.theme = resolved;
                  document.documentElement.dataset.themePreference = preference;
                } catch (error) {
                  document.documentElement.dataset.theme = 'dark';
                  document.documentElement.dataset.themePreference = 'system';
                }
              })();
            `
          }}
        />
      </head>
      <body>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
        </ThemeProvider>
      </body>
    </html>
  );
}
