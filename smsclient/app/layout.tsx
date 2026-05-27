import { AuthGate } from "@/components/auth/AuthGate";
import { OnboardingGate } from "@/components/auth/OnboardingGate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { UserProfileProvider } from "@/components/auth/UserProfileProvider";
import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "smsclient.fr - Application SMS",
  description: "Application SMS — prototype cliquable",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="relative h-full w-full overflow-hidden">
        <AuthProvider>
          <AuthGate>
            <UserProfileProvider>
              <OnboardingGate>{children}</OnboardingGate>
            </UserProfileProvider>
          </AuthGate>
        </AuthProvider>
      </body>
    </html>
  );
}
