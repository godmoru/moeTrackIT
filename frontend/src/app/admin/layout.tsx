"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";

const navItems = [
  { href: "/admin/dashboard", label: "Dashboard" },
  { href: "/admin/assessments", label: "Assessments" },
  { href: "/admin/income-sources", label: "Income Sources" },
  { href: "/admin/entities", label: "Institutions" },
  { href: "/admin/revenue", label: "Revenue & Collections" },
  { href: "/admin/payments", label: "Payments" },
  { href: "/admin/lgas", label: "LGAs" },
];

function NavIcon({ href }: { href: string }) {
  const baseProps = {
    className: "h-4 w-4 flex-shrink-0",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (href.startsWith("/admin/dashboard")) {
    return (
      <svg {...baseProps}>
        <path d="M3 11h6V3H3v8Zm12 10h6v-8h-6v8ZM3 21h6v-6H3v6Zm12-10h6V3h-6v8Z" />
      </svg>
    );
  }

  if (href.startsWith("/admin/assessments")) {
    return (
      <svg {...baseProps}>
        <path d="M5 5h14M5 12h14M5 19h8" />
      </svg>
    );
  }

  if (href.startsWith("/admin/income-sources")) {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="12" r="4" />
        <path d="M4 12h2m12 0h2M12 4v2m0 12v2" />
      </svg>
    );
  }

  if (href.startsWith("/admin/entities")) {
    return (
      <svg {...baseProps}>
        <path d="M4 21V9l8-4 8 4v12M9 21v-6h6v6" />
      </svg>
    );
  }

  if (href.startsWith("/admin/revenue")) {
    return (
      <svg {...baseProps}>
        <path d="M4 19h16M6 16l3-4 3 3 4-6 2 3" />
      </svg>
    );
  }

  if (href.startsWith("/admin/payments")) {
    return (
      <svg {...baseProps}>
        <rect x="3" y="7" width="18" height="10" rx="2" />
        <path d="M7 11h4" />
      </svg>
    );
  }

  if (href.startsWith("/admin/lgas")) {
    return (
      <svg {...baseProps}>
        <path d="M4 10h16v10H4z" />
        <path d="M8 10V4h8v6" />
      </svg>
    );
  }

  return (
    <svg {...baseProps}>
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
    }
  }, [router]);

  async function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    router.replace("/login");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <aside className="hidden w-60 flex-col bg-green-800 p-4 text-sm text-green-50 md:flex">
        <div className="mb-6">
          <div className="flex items-center gap-3">
            <img className="h-12 w-12 rounded-full" src="/benue.png" alt="Benue State" />
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-green-100">
                Benue State
              </div>
              <div className="text-[11px] text-green-100">Education Revenue</div>
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                  active ? "bg-green-700 text-white" : "text-green-100 hover:bg-green-700/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <NavIcon href={item.href} />
                  <span>{item.label}</span>
                </span>
              </Link>
            );
          })}
        </nav>
        <button
          onClick={handleLogout}
          className="mt-4 rounded-md bg-green-700 px-3 py-2 text-xs font-semibold text-white hover:bg-green-600"
        >
          Logout
        </button>
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b bg-white px-4 py-3 text-sm">
          <div className="flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
           >
              {mobileNavOpen ? "Close" : "Menu"}
            </button>
            <div className="font-semibold text-gray-800">Admin Portal</div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800"
            >
              Logout
            </button>
          </div>
          <div className="hidden items-center justify-between md:flex">
            <div className="font-semibold text-gray-800">Admin Portal</div>
            <button
              onClick={handleLogout}
              className="rounded-md bg-green-700 px-3 py-1 text-xs font-semibold text-white hover:bg-green-800"
            >
              Logout
            </button>
          </div>
          {mobileNavOpen && (
            <nav className="mt-3 space-y-1 border-t pt-3 text-xs md:hidden">
              {navItems.map((item) => {
                const active = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`block rounded-md px-3 py-2 font-medium transition-colors ${
                      active
                        ? "bg-green-100 text-green-800"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                    onClick={() => setMobileNavOpen(false)}
                  >
                    <span className="flex items-center gap-2">
                      <NavIcon href={item.href} />
                      <span>{item.label}</span>
                    </span>
                  </Link>
                );
              })}
            </nav>
          )}
        </header>
        <main className="flex-1 px-4 py-4">{children}</main>
      </div>
    </div>
  );
}
