import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Navbar } from "@/components/Navbar";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#eff6ff" },
    { media: "(prefers-color-scheme: dark)", color: "#020817" },
  ],
};

export const metadata: Metadata = {
  title: "SOS Gás | Gestão",
  description: "Controle de estoque, notas e boletos.",
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <body className="antialiased text-slate-900 bg-blue-50 dark:bg-slate-950 dark:text-slate-100 min-h-screen selection:bg-blue-200 dark:selection:bg-blue-900 flex flex-col md:block">
        <AuthProvider>
          <Navbar />
          <div className="flex-1 max-w-7xl mx-auto w-full relative">
            {children}
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
