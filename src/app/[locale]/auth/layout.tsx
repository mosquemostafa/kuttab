import type { Metadata } from "next";
import { privateSurfaceRobots } from "@/lib/seo/private-surface-robots";

export function generateMetadata(): Metadata {
  return { robots: privateSurfaceRobots };
}

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="relative min-h-screen bg-background bg-islamic-stars">
      {children}
    </div>
  );
}
