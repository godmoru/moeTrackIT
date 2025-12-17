"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface UserInfo {
  name: string;
  email: string;
  role: string;
}

export default function LockScreenPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check if we have a valid session to lock
    const token = localStorage.getItem("authToken");
    if (!token) {
      router.replace("/login");
      return;
    }

    // Decode JWT to get user info
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload) {
          setUserInfo({
            name: payload.name || payload.email?.split("@")[0] || "User",
            email: payload.email || "",
            role: payload.role || "user",
          });
        }
      }
    } catch {
      router.replace("/login");
    }
  }, [router]);

  // Get initials for avatar
  const initials = userInfo?.name
    ? userInfo.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Re-authenticate with the stored email and entered password
      const res = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: userInfo?.email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || "Invalid password");
      }

      const data = await res.json();
      if (data.token) {
        // Update token and redirect back to admin
        localStorage.setItem("authToken", data.token);
        sessionStorage.removeItem("lockScreen");
        router.push("/admin/dashboard");
      } else {
        throw new Error("Invalid response from server");
      }
    } catch (err: any) {
      setError(err.message || "Failed to unlock");
    } finally {
      setLoading(false);
    }
  }

  function handleLogout() {
    if (typeof window !== "undefined") {
      localStorage.removeItem("authToken");
      sessionStorage.removeItem("lockScreen");
    }
    router.replace("/login");
  }

  if (!userInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-800 to-green-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-white border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-800 to-green-900">
      <div className="w-full max-w-sm">
        {/* Lock icon */}
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/10">
            <svg
              className="h-8 w-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-white">Screen Locked</h1>
          <p className="mt-1 text-sm text-green-100">
            Enter your password to unlock
          </p>
        </div>

        {/* User card */}
        <div className="rounded-lg bg-white p-6 shadow-xl">
          <div className="mb-6 text-center">
            {/* Avatar */}
            <div className="mx-auto mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-green-700 text-2xl font-bold text-white">
              {initials}
            </div>
            <div className="text-lg font-semibold text-gray-900">{userInfo.name}</div>
            <div className="text-sm text-gray-500">{userInfo.email}</div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div>
              <label className="sr-only">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
                autoFocus
                className="w-full rounded-md border border-gray-300 px-4 py-3 text-center text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              />
            </div>
            {error && (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center rounded-md bg-green-700 px-4 py-3 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {loading ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Unlocking...
                </>
              ) : (
                <>
                  <svg className="mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z"
                    />
                  </svg>
                  Unlock
                </>
              )}
            </button>
          </form>

          <div className="mt-4 text-center">
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-gray-700 hover:underline"
            >
              Sign in as different user
            </button>
          </div>
        </div>

        {/* Branding */}
        <div className="mt-6 text-center">
          <p className="text-xs text-green-200">
            Benue State Ministry of Education
          </p>
          <p className="text-xs text-green-300">
            Education Revenue Management System
          </p>
        </div>
      </div>
    </div>
  );
}
