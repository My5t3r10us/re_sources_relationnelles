import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "(RE)Sources Relationnelles",
  description:
    "Plateforme collaborative de ressources pour le bien-être relationnel et la santé mentale.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
