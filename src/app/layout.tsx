import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/authContext";

export const metadata: Metadata = {
  title: "Near-Miss Accident Predictor | AI-Powered Driving Risk Analytics",
  description:
    "Real-time AI-powered near-miss accident prediction system. Analyzes driving behavior to calculate risk scores, detect dangerous patterns, and alert drivers before accidents happen.",
  keywords: ["near-miss", "accident prediction", "AI", "driving safety", "risk analytics"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" data-scroll-behavior="smooth">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
