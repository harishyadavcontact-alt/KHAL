import "./globals.css";
import { AppShell } from "../components/app-shell";

export const metadata = {
  title: "Khal v0.1",
  description: "Decision operating system over local SQLite"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
