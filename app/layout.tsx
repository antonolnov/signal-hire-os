import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Signal Hire OS",
  description: "Операторский ATS MVP для ИИ-ориентированных процессов рекрутинга.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
