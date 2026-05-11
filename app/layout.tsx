import type { ReactNode } from "react";
import "./globals.css";

// Minimal root layout — html/body are provided by app/[locale]/layout.tsx
export default function RootLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
