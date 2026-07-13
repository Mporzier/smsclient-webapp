import { AuthGate } from "@/components/auth/AuthGate";
import { OnboardingGate } from "@/components/auth/OnboardingGate";
import { AuthProvider } from "@/components/auth/AuthProvider";
import { UserProfileProvider } from "@/components/auth/UserProfileProvider";
import { OpenWidgetLoader } from "@/components/OpenWidgetLoader";
import type { Metadata } from "next";
import { Inter, Geist_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

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
      className={cn("h-full", "antialiased", inter.variable, geistMono.variable, "font-sans", geist.variable)}
    >
      <body className="relative h-full w-full overflow-hidden">
        <AuthProvider>
          <AuthGate>
            <UserProfileProvider>
              <OnboardingGate>{children}</OnboardingGate>
            </UserProfileProvider>
          </AuthGate>
        </AuthProvider>
        <OpenWidgetLoader />
      </body>
    </html>
  );
}
