"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function DashboardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              BluePixel
            </Link>
            <nav className="flex gap-4 text-sm">
              <Link
                href="/dashboard"
                className={pathname === "/dashboard" ? "font-medium" : "text-gray-600"}
              >
                Dashboard
              </Link>
              <Link
                href="/dashboard/requests"
                className={pathname.startsWith("/dashboard/requests") ? "font-medium" : "text-gray-600"}
              >
                Solicitudes
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {session?.user?.name} ({session?.user?.role})
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              Salir
            </Button>
          </div>
        </div>
      </header>
      <main className="container mx-auto p-4">{children}</main>
    </div>
  );
}