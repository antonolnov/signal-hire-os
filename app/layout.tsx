import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Hire OS",
  description: "AI-native ATS MVP for recruiting teams of 5-20 recruiters.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
