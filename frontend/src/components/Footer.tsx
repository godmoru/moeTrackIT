"use client";

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid gap-8 text-xs text-gray-600 md:grid-cols-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <img
                src="/benue.png"
                alt="Benue State"
                className="h-9 w-9 rounded-full"
              />
              <div className="flex flex-col">
                <span className="text-[11px] font-bold uppercase tracking-wide text-green-700">
                  Benue State
                </span>
                <span className="text-[11px] font-medium text-gray-800">
                  Ministry of Education & Knowledge Management
                </span>
              </div>
            </div>
            <p className="max-w-xs text-[11px] text-gray-600">
              Centralized revenue management for schools and education vendors across
              the 23 Local Government Areas of Benue State.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-800">
              Platform
            </h3>
            <ul className="space-y-1 text-[11px]">
              <li>Dashboard & Reports</li>
              <li>Entities & Profiles</li>
              <li>Assessments & Billing</li>
              <li>Collections & Revenue</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-800">
              For Officers
            </h3>
            <ul className="space-y-1 text-[11px]">
              <li>School registration</li>
              <li>License renewals</li>
              <li>Income sources setup</li>
              <li>Data exports (CSV / Excel / PDF)</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h3 className="text-[11px] font-semibold uppercase tracking-wide text-gray-800">
              Contact & Support
            </h3>
            <ul className="space-y-1 text-[11px]">
              <li>Benue State Ministry of Education</li>
              <li>Makurdi, Benue State, Nigeria</li>
              <li>For internal use by authorized officers only.</li>
            </ul>
          </div>
        </div>

        <div className="mt-8 flex flex-col justify-between gap-2 border-t pt-4 text-[11px] text-gray-500 md:flex-row">
          <span> {year} Benue State Ministry of Education.</span>
          <span>Education Revenue Management System</span>
        </div>
      </div>
    </footer>
  );
}