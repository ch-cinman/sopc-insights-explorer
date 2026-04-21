import type { Metadata } from "next";
import "./globals.css";
import PostHogProvider from "@/components/PostHogProvider";

export const metadata: Metadata = {
  title: "SoPC Insights Explorer — Courier Health 2026",
  description:
    "Explore findings from Courier Health's 2026 State of Patient-Centricity survey, filtered to your segment.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <PostHogProvider>{children}</PostHogProvider>
      </body>
    </html>
  );
}
