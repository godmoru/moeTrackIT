"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function IncomePage() {
  const { hasRole } = useAuth();
  const canView = hasRole(["super_admin", "admin", "system_admin", "officer", "cashier", "account_officer", "area_education_officer", "principal"]);

  if (!canView) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Access Denied</h1>
          <p className="mt-2 text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Income Management</h1>
          <p className="text-sm text-gray-600">
            Manage assessments and income sources
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <rect x="1" y="4" width="22" height="16" rx="2" />
                <line x1="1" y1="10" x2="22" y2="10" />
                <line x1="1" y1="15" x2="22" y2="15" />
                <circle cx="5" cy="7" r="1" fill="currentColor" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-base font-semibold text-gray-900">Assessments</h3>
              <p className="mt-1 text-sm text-gray-600">Create and manage assessments</p>
            </div>
          </div>
          <Link
            href="/admin/assessments"
            className="mt-4 block rounded-md bg-green-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-green-800 focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2"
          >
            Manage Assessments
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-sm">
          <div className="flex items-center">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
              <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path d="M9 11l3 3L22 4" />
                <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
              </svg>
            </div>
            <div className="ml-4">
              <h3 className="text-base font-semibold text-gray-900">Income Sources</h3>
              <p className="mt-1 text-sm text-gray-600">Manage income source categories</p>
            </div>
          </div>
          <Link
            href="/admin/income-sources"
            className="mt-4 block rounded-md bg-blue-700 px-4 py-2 text-center text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2"
          >
            Manage Sources
          </Link>
        </div>
      </div>
    </div>
  );
}
