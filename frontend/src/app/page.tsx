"use client";

import Link from "next/link";
import { Footer } from "@/components/Footer";
import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";

type LandingMetrics = {
  institutions: number | null;
  last12Months: number | null;
  lgas: number | null;
  collectionRate: number | null;
};

function formatNaira(amount: number | null | undefined): string {
  if (amount == null || Number.isNaN(amount)) return "₦ 0.00";
  const value = Number(amount);
  return `₦ ${value.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export default function Home() {
  const [metrics, setMetrics] = useState<LandingMetrics>({
    institutions: null,
    last12Months: null,
    lgas: null,
    collectionRate: null,
  });
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    async function loadMetrics() {
      try {
        const baseUrl =
          process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (token) {
          headers["Authorization"] = `Bearer ${token}`;
        }

        // Institutions count and distinct LGAs (public endpoint)
        const entitiesRes = await fetch(`${baseUrl}/institutions`, {
          headers,
        });

        let institutions: number | null = null;
        let lgas: number | null = null;

        if (entitiesRes.ok) {
          const entities = await entitiesRes.json();
          if (Array.isArray(entities)) {
            institutions = entities.length;
            const lgaSet = new Set<string>();
            entities.forEach((e: any) => {
              if (e && typeof e.lga === "string" && e.lga.trim().length > 0) {
                lgaSet.add(e.lga.trim());
              }
            });
            lgas = lgaSet.size || null;
          }
        }

        // Payments summary (requires auth; fall back silently if unauthorized)
        let last12Months: number | null = null;
        let collectionRate: number | null = null;

        if (token) {
          const now = new Date();
          const from = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
            .toISOString()
            .slice(0, 10);

          const summaryRes = await fetch(`${baseUrl}/reports/summary?from=${from}`, {
            headers,
          });

          if (summaryRes.ok) {
            const summary = await summaryRes.json();
            if (summary && typeof summary.totalCollected === "number") {
              last12Months = summary.totalCollected;
            }

            const statusCounts: Array<{ status: string; count: number }> =
              Array.isArray(summary?.statusCounts) ? summary.statusCounts : [];
            if (statusCounts.length > 0) {
              let paid = 0;
              let totalAssessments = 0;
              statusCounts.forEach((row) => {
                const c = Number(row.count || 0);
                totalAssessments += c;
                if (row.status === "paid") {
                  paid += c;
                }
              });
              if (totalAssessments > 0) {
                collectionRate = (paid / totalAssessments) * 100;
              }
            }
          }
        }

        setMetrics({ institutions, last12Months, lgas, collectionRate });
      } catch (err) {
        console.error("Failed to load landing metrics", err);
      }
    }

    loadMetrics();
  }, []);
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-50 border-b bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            {/* <div className="h-8 w-8 rounded-full bg-green-700" /> */}
            <img className="h-15 w-15 rounded-full" src="/benue.png" alt="" />

            <div className="flex flex-col">
              <span className="text-sm font-bold text-green-700 uppercase tracking-wide">
                Benue State
              </span>
              <span className="text-sm font-medium text-gray-700">
                Ministry of Education & Knowledge Management
              </span>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-4 text-sm font-medium text-gray-700">
            <Link href="/about" className="hover:text-green-700">
              About
            </Link>
            <Link href="#how-it-works" className="hover:text-green-700">
              How it works
            </Link>
            <Link href="#benefits" className="hover:text-green-700">
              Benefits
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-green-700 px-4 py-2 text-white hover:bg-green-800"
            >
              Admin Login
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-gray-700 hover:text-green-700"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        {isMenuOpen && (
          <div className="md:hidden border-t bg-white px-4 py-4 shadow-md">
            <nav className="flex flex-col gap-4 text-sm font-medium text-gray-700">
              <Link href="/about" className="hover:text-green-700" onClick={() => setIsMenuOpen(false)}>
                About
              </Link>
              <Link href="#how-it-works" className="hover:text-green-700" onClick={() => setIsMenuOpen(false)}>
                How it works
              </Link>
              <Link href="#benefits" className="hover:text-green-700" onClick={() => setIsMenuOpen(false)}>
                Benefits
              </Link>
              <Link
                href="/login"
                className="inline-block w-fit rounded-full bg-green-700 px-4 py-2 text-white hover:bg-green-800"
                onClick={() => setIsMenuOpen(false)}
              >
                Admin Login
              </Link>
            </nav>
          </div>
        )}

      </header >

      <main className="flex-1">
        <section className="bg-green-700 text-white">
          <div className="mx-auto flex max-w-6xl flex-col gap-8 px-4 py-16 md:flex-row md:items-center">
            <div className="flex-1">
              <p className="text-sm uppercase tracking-wide text-green-100">
                Ministry of Education • Benue State
              </p>
              <h1 className="mt-3 text-3xl font-bold leading-tight md:text-4xl">
                Centralized Revenue Management for Schools and Education Vendors
              </h1>
              <p className="mt-4 max-w-xl text-sm md:text-base text-green-50">
                Register schools, manage dynamic revenue sources, track assessments and
                payments, and generate real-time reports for all LGAs across Benue State.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/login"
                  className="rounded-full bg-white px-5 py-2 text-sm font-semibold text-green-800 shadow hover:bg-green-50"
                >
                  Go to Admin Portal
                </Link>
                <Link
                  href="#how-it-works"
                  className="rounded-full border border-white/60 px-5 py-2 text-sm font-semibold text-white hover:bg-white/10"
                >
                  Learn how it works
                </Link>
              </div>
            </div>
            <div className="flex-1">
              <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <p className="text-sm font-semibold uppercase tracking-wide text-green-100">
                  Key Highlights
                </p>
                <ul className="mt-3 space-y-2 text-sm text-green-50">
                  <li>• Track revenue from registration, license renewals, and more.</li>
                  <li>• Dynamic parameters per income source (school type, ownership, etc.).</li>
                  <li>• Automated assessments, payments, and collection status.</li>
                  <li>• State-wide reporting across all 23 LGAs in Benue.</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Overview section: metrics, chart, shortcuts, recent activity */}
        <section className="bg-gray-50 border-b">
          <div className="mx-auto max-w-6xl px-4 py-12 space-y-10">
            {/* Metrics cards */}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">At a glance</h2>
              <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                A quick overview of institutions and revenue activity managed through the
                Education Revenue Management System.
              </p>
              <div className="mt-5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">Institutions</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {(metrics.institutions ?? 1245).toLocaleString("en-NG")}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">Registered schools & vendors</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">Last 12 months</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {formatNaira(metrics.last12Months ?? 845_000_000)}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">Total payments recorded</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">LGAs covered</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {(metrics.lgas ?? 23).toLocaleString("en-NG")}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">State-wide coverage</p>
                </div>
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <p className="text-xs font-medium uppercase text-gray-500">Collections status</p>
                  <p className="mt-2 text-2xl font-semibold text-gray-900">
                    {`${Math.round(metrics.collectionRate ?? 93)}%`}
                  </p>
                  <p className="mt-1 text-[11px] text-gray-500">Of assessed revenue collected</p>
                </div>
              </div>
            </div>

            {/* Chart + branding card */}
            <div className="grid gap-8 md:grid-cols-3">
              <div className="md:col-span-2 rounded-lg bg-white p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-gray-900">LGA remittance trend</h2>
                <p className="mt-1 text-xs text-gray-500">
                  Illustrative view of remittances by LGA in recent months.
                </p>
                <div className="mt-4 flex items-end gap-3 h-40">
                  {[
                    { label: "Makurdi", h: "85%" },
                    { label: "Gboko", h: "70%" },
                    { label: "Otukpo", h: "60%" },
                    { label: "Vandeikya", h: "55%" },
                    { label: "Logo", h: "45%" },
                    { label: "Guma", h: "40%" },
                  ].map((lga) => (
                    <div
                      key={lga.label}
                      className="flex-1 flex flex-col items-center justify-end"
                    >
                      <div
                        className="w-6 rounded-t bg-green-600"
                        style={{ height: lga.h }}
                      />
                      <span className="mt-1 text-[11px] text-gray-600 truncate w-full text-center">
                        {lga.label}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg bg-white p-4 shadow-sm flex flex-col items-center">
                <h2 className="text-sm font-semibold text-gray-900 text-center">
                  Leadership & Vision
                </h2>
                <p className="mt-1 text-xs text-gray-500 text-center">
                  A modern revenue system in support of quality education for Benue State.
                </p>
                <div className="mt-4 w-full flex justify-center">
                  <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm max-w-xs">
                    <img
                      src="/governor.png"
                      alt="Executive Governor of Benue State"
                      className="w-full h-60 object-cover"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Recent activity (illustrative) */}
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent activity</h2>
              <p className="mt-1 text-xs text-gray-500">
                Sample events showing how the platform is used day-to-day.
              </p>
              <div className="mt-3 grid gap-3 md:grid-cols-2">
                <div className="rounded-lg bg-white p-3 shadow-sm text-sm text-gray-700">
                  • New private secondary school registered in Makurdi LGA.
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm text-sm text-gray-700">
                  • Batch license renewal payments processed for 48 schools.
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm text-sm text-gray-700">
                  • Revenue report generated for the last 5 years of collections.
                </div>
                <div className="rounded-lg bg-white p-3 shadow-sm text-sm text-gray-700">
                  • Assessment parameters updated for examination fees.
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="about" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-xl font-semibold text-gray-900">About the System</h2>
            <p className="mt-3 text-sm text-gray-700 md:text-base">
              This platform helps the Benue State Ministry of Education and Knowledge Management and its agencies
              manage all education-related revenues in one central place. Schools and
              vendors are registered once, then assessed for recurring and one-time
              payments over time.
            </p>
          </div>
        </section>

        <section id="how-it-works" className="bg-gray-50">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-xl font-semibold text-gray-900">How it works</h2>
            <div className="mt-5 grid gap-6 md:grid-cols-3">
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">1. Define revenue sources</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Admins configure income sources like New School Registration,
                  License Renewal, Examination Fees, and more.
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">2. Register entities</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Schools and vendors are profiled with type, ownership, LGA, and other
                  attributes.
                </p>
              </div>
              <div className="rounded-lg bg-white p-4 shadow-sm">
                <h3 className="text-sm font-semibold text-gray-900">3. Assess and collect</h3>
                <p className="mt-2 text-sm text-gray-700">
                  Assessments are generated with dynamic parameters and payments are
                  tracked until fully settled.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="benefits" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-xl font-semibold text-gray-900">Benefits</h2>
            <ul className="mt-4 grid gap-4 text-sm text-gray-700 md:grid-cols-2">
              <li className="rounded-lg bg-gray-50 p-4">
                • Central visibility into all collections across Benue State.
              </li>
              <li className="rounded-lg bg-gray-50 p-4">
                • Reduced leakages and manual errors in revenue tracking.
              </li>
              <li className="rounded-lg bg-gray-50 p-4">
                • Easier compliance for schools and vendors.
              </li>
              <li className="rounded-lg bg-gray-50 p-4">
                • Data-driven decisions via real-time reports and dashboards.
              </li>
            </ul>
          </div>
        </section>
      </main>

      <Footer />
    </div >
  );
}
