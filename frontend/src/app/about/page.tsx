import Link from "next/link";
import { Footer } from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2">
            <img className="h-10 w-10 rounded-full" src="/benue.png" alt="Benue State" />
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
            <Link href="/" className="hover:text-green-700">
              Home
            </Link>
            <Link
              href="/login"
              className="rounded-full bg-green-700 px-4 py-2 text-white hover:bg-green-800"
            >
              Admin Login
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1 bg-white">
        <section className="border-b bg-green-700 text-white">
          <div className="mx-auto max-w-6xl px-4 py-10">
            <h1 className="text-2xl font-bold md:text-3xl">
              About the Education Revenue Management System
            </h1>
            <p className="mt-3 max-w-2xl text-sm md:text-base text-green-50">
              This platform helps the Benue State Ministry of Education and its agencies
              manage all education-related revenues in one central place. Schools and vendors
              can be registered once, then assessed for recurring and one-time payments over
              time.
            </p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-4 py-10 space-y-8 text-sm text-gray-700 md:text-base">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Objectives</h2>
              <p className="mt-2">
                The system provides a single source of truth for all education revenue across
                the 23 Local Government Areas of Benue State. It supports transparent
                collections, reduces leakages, and gives decision makers real-time insight
                into performance.
              </p>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Key Capabilities</h2>
              <ul className="mt-3 list-disc space-y-1 pl-5">
                <li>Register and profile schools and education vendors once.</li>
                <li>
                  Configure dynamic income sources such as New School Registration, License
                  Renewal, and Examination Fees.
                </li>
                <li>Generate assessments for both recurring and one-time payments.</li>
                <li>Track payments, balances, and collection status per entity and per LGA.</li>
                <li>Export collections and assessments for further analysis and auditing.</li>
              </ul>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Stakeholders</h2>
              <p className="mt-2">
                The primary users are officers in the Ministry of Education and related MDAs
                responsible for school oversight, licensing, and revenue collection. The
                system is also designed to make compliance easier for schools and vendors.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
