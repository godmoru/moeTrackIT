"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useState } from "react";
import { UserHeader } from "@/components/UserHeader";

// All supported roles
const ALL_ROLES = ["super_admin", "admin", "system_admin", "officer", "cashier", "account_officer", "area_education_officer", "principal"];
const ADMIN_ROLES = ["super_admin", "admin", "system_admin"];
const REVENUE_ROLES = ["super_admin", "admin", "officer", "cashier", "account_officer", "area_education_officer","principal"];

// Navigation items with role-based visibility
const navItems = [
  { href: "/admin/dashboard", label: "Dashboard", title: "Overview", roles: ALL_ROLES },
  { href: "/admin/assessments", label: "Assessments", title: "Assessments management", roles: ALL_ROLES },
  { href: "/admin/income-sources", label: "Income Sources", title: "Manage income sources", roles: ADMIN_ROLES.concat(["officer"]) },
  { href: "/admin/institutions", label: "Institutions", title: "Institution directory", roles: ALL_ROLES },
  { href: "/admin/revenue", label: "Revenue & Collections", title: "Revenue summary", roles: REVENUE_ROLES },
  { href: "/admin/payments", label: "Payments", title: "Payments list", roles: ALL_ROLES },
  { href: "/admin/lgas", label: "LGAs", title: "Local Government Areas", roles: ADMIN_ROLES.concat(["officer", "area_education_officer"]) },
  { href: "/admin/reports", label: "Reports", title: "Reporting and analytics", roles: ALL_ROLES },
  { href: "/admin/control-panel", label: "Control Panel", title: "Users, roles and settings", roles: ADMIN_ROLES },
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

  if (href.startsWith("/admin/institutions")) {
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

  if (href.startsWith("/admin/reports")) {
    return (
      <svg {...baseProps}>
        <path d="M4 19h16" />
        <path d="M7 16v-6" />
        <path d="M12 16V8" />
        <path d="M17 16v-4" />
      </svg>
    );
  }

  if (href.startsWith("/admin/control-panel")) {
    return (
      <svg {...baseProps}>
        <circle cx="12" cy="12" r="3" />
        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.65 1.65 0 0 0 15 19.4a1.65 1.65 0 0 0-1 .6 1.65 1.65 0 0 0-.33 1.1V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-.33-1.1 1.65 1.65 0 0 0-1-.6 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15 1.65 1.65 0 0 0 4 14a1.65 1.65 0 0 0-1.1-.33H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.2 9a1.65 1.65 0 0 0 .4-1 1.65 1.65 0 0 0-.6-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6 1.65 1.65 0 0 0 10 4a1.65 1.65 0 0 0 .33-1.1V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 14.8 4.2 1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1 .4 1.65 1.65 0 0 0 1.82-.6l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9 1.65 1.65 0 0 0 20 10c0 .37.13.73.33 1.02.2.3.47.53.77.69" />
      </svg>
    );
  }

  return (
    <svg {...baseProps}>
      <circle cx="12" cy="12" r="4" />
    </svg>
  );
}

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Decode JWT payload to extract user info for UI
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload) {
          setUserRole(payload.role || null);
          setUserInfo({
            name: payload.name || payload.email?.split("@")[0] || "User",
            email: payload.email || "",
            role: payload.role || "user",
          });
        }
      }
    } catch {
      // If decoding fails, keep userRole as null and rely on backend auth for protection
    }
  }, [router]);

  function canSeeNavItem(item: typeof navItems[0]): boolean {
    if (!userRole) return true; // Show all if role not loaded yet
    return item.roles.includes(userRole);
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
          {navItems.filter((item) => canSeeNavItem(item)).map((item) => {
            const active = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                title={item.title}
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
        {/* User info in sidebar */}
        {userInfo && (
          <div className="mt-4 border-t border-green-700 pt-4">
            <div className="flex items-center gap-2 px-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-600 text-xs font-semibold text-white">
                {userInfo.name
                  .split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-white truncate">{userInfo.name}</div>
                <div className="text-[10px] text-green-200 truncate">{userInfo.email}</div>
              </div>
            </div>
          </div>
        )}
      </aside>
      <div className="flex min-h-screen flex-1 flex-col">
        <header className="border-b bg-white px-4 py-2 text-sm">
          <div className="flex items-center justify-between md:hidden">
            <button
              type="button"
              onClick={() => setMobileNavOpen((prev) => !prev)}
              className="inline-flex items-center justify-center rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50"
            >
              {mobileNavOpen ? "Close" : "Menu"}
            </button>
            <div className="font-semibold text-gray-800">Admin Portal</div>
            <UserHeader
              userName={userInfo?.name}
              userEmail={userInfo?.email}
              userRole={userInfo?.role}
            />
          </div>
          <div className="hidden items-center justify-between md:flex">
            <div className="font-semibold text-gray-800">Admin Portal</div>
            <UserHeader
              userName={userInfo?.name}
              userEmail={userInfo?.email}
              userRole={userInfo?.role}
            />
          </div>
          {mobileNavOpen && (
            <nav className="mt-3 space-y-1 border-t pt-3 text-xs md:hidden">
              {navItems.filter((item) => canSeeNavItem(item)).map((item) => {
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
                    title={item.title}
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
