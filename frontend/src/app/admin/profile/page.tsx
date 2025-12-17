"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface UserInfo {
  id: number;
  name: string;
  email: string;
  role: string;
}

export default function ProfilePage() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("authToken");
    if (!token) return;

    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload) {
          setUserInfo({
            id: payload.id || 0,
            name: payload.name || payload.email?.split("@")[0] || "User",
            email: payload.email || "",
            role: payload.role || "user",
          });
        }
      }
    } catch {
      // Ignore decode errors
    }
  }, []);

  // Get initials for avatar
  const initials = userInfo?.name
    ? userInfo.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Format role for display
  const displayRole = userInfo?.role
    ? userInfo.role
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "User";

  if (!userInfo) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-1 text-sm text-gray-600">
          View and manage your account information.
        </p>
      </div>

      <div className="rounded-lg bg-white shadow">
        {/* Profile header */}
        <div className="border-b border-gray-200 bg-gradient-to-r from-green-700 to-green-800 px-6 py-8 rounded-t-lg">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-green-700">
              {initials}
            </div>
            <div>
              <h2 className="text-xl font-semibold text-white">{userInfo.name}</h2>
              <p className="text-green-100">{userInfo.email}</p>
              <span className="mt-2 inline-block rounded-full bg-green-600 px-3 py-1 text-xs font-medium text-white">
                {displayRole}
              </span>
            </div>
          </div>
        </div>

        {/* Profile details */}
        <div className="p-6">
          <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-4">
            Account Information
          </h3>
          
          <dl className="space-y-4">
            <div className="flex justify-between py-3 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Full Name</dt>
              <dd className="text-sm text-gray-900">{userInfo.name}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Email Address</dt>
              <dd className="text-sm text-gray-900">{userInfo.email}</dd>
            </div>
            <div className="flex justify-between py-3 border-b border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Role</dt>
              <dd className="text-sm text-gray-900">{displayRole}</dd>
            </div>
            <div className="flex justify-between py-3">
              <dt className="text-sm font-medium text-gray-500">User ID</dt>
              <dd className="text-sm text-gray-900">#{userInfo.id}</dd>
            </div>
          </dl>
        </div>

        {/* Actions */}
        <div className="border-t border-gray-200 bg-gray-50 px-6 py-4 rounded-b-lg">
          <div className="flex flex-wrap gap-3">
            <Link
              href="/admin/change-password"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </Link>
            <Link
              href="/admin/settings"
              className="inline-flex items-center gap-2 rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
