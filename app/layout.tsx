import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SQL Technical Assessment | WareBee",
  description: "Data Engineering & SQL Skills Assessment for WareBee",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
