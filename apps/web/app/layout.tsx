import "./globals.css";
import { AppShell } from "../components/app-shell";
import Script from "next/script";

export const metadata = {
  title: "Khal v0.1",
  description: "Decision operating system over local SQLite"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
