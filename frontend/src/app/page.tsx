import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
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
          <nav className="flex items-center gap-4 text-sm font-medium text-gray-700">
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
              {/* Ifalreay logged in, change to Admin Area */}

            </Link>
          </nav>
        </div>
      </header>

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

        <section id="about" className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-12">
            <h2 className="text-xl font-semibold text-gray-900">About the System</h2>
            <p className="mt-3 text-sm text-gray-700 md:text-base">
              This platform helps the Benue State Ministry of Education and its agencies
              manage all education-related revenues in one central place. Schools and
              vendors can be registered once, then assessed for recurring and one-time
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
    </div>
  );
}
