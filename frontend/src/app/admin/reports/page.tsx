"use client";

import Link from "next/link";

export default function AdminReportsPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Reports</h1>
          <p className="text-xs text-gray-500">
            Download key CSV reports for institutions, assessments, payments and revenue.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Institution Reports
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            Per-institution assessments, payments and yearly revenue summaries.
          </p>
          <div className="mt-3 flex gap-2 text-xs">
            <Link
              href="/admin/entities"
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50"
            >
              Go to Institutions
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Assessment Reports
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            View and export assessments across income sources and years.
          </p>
          <div className="mt-3 flex gap-2 text-xs">
            <Link
              href="/admin/assessments"
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50"
            >
              Go to Assessments
            </Link>
          </div>
        </div>

        <div className="rounded-lg bg-white p-4 shadow-sm">
          <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Payments & Collections
          </h2>
          <p className="mt-2 text-xs text-gray-600">
            Monitor payments and export payment histories by institution.
          </p>
          <div className="mt-3 flex gap-2 text-xs">
            <Link
              href="/admin/payments"
              className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50"
            >
              Go to Payments
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
