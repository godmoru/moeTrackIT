"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface UserHeaderProps {
  userName?: string;
  userEmail?: string;
  userRole?: string;
}

export function UserHeader({ userName, userEmail, userRole }: UserHeaderProps) {
  const router = useRouter();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Get initials for avatar
  const initials = userName
    ? userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  // Format role for display
  const displayRole = userRole
    ? userRole
        .split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    : "User";

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
    }
    router.replace("/login");
  }

  function handleLockScreen() {
    if (typeof window !== "undefined") {
      // Store that we're in lock screen mode
      sessionStorage.setItem("lockScreen", "true");
    }
    router.push("/lock-screen");
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!dropdownOpen)}
        className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 transition-colors"
      >
        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-700 text-xs font-semibold text-white">
          {initials}
        </div>
        {/* User info (hidden on mobile) */}
        <div className="hidden text-left sm:block">
          <div className="text-sm font-medium text-gray-900">{userName || "User"}</div>
          <div className="text-xs text-gray-500">{displayRole}</div>
        </div>
        {/* Dropdown arrow */}
        <svg
          className={`h-4 w-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown menu */}
      {dropdownOpen && (
        <div className="absolute right-0 top-full z-50 mt-1 w-56 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
          {/* User info header */}
          <div className="border-b border-gray-100 px-4 py-3">
            <div className="text-sm font-medium text-gray-900">{userName || "User"}</div>
            <div className="text-xs text-gray-500 truncate">{userEmail || ""}</div>
            <div className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
              {displayRole}
            </div>
          </div>

          {/* Menu items */}
          <div className="py-1">
            <Link
              href="/admin/profile"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              My Profile
            </Link>

            <Link
              href="/admin/settings"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>

            <Link
              href="/admin/change-password"
              onClick={() => setDropdownOpen(false)}
              className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </Link>

            <button
              onClick={() => {
                setDropdownOpen(false);
                handleLockScreen();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
              Lock Screen
            </button>
          </div>

          {/* Logout */}
          <div className="border-t border-gray-100 py-1">
            <button
              onClick={() => {
                setDropdownOpen(false);
                handleLogout();
              }}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
