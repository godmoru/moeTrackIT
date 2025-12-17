"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (oldPassword === newPassword) {
      setError("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

      const res = await fetch(`${API_BASE}/auth/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      setSuccess(true);
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(err.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Change Password</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your password to keep your account secure.
        </p>
      </div>

      <div className="rounded-lg bg-white p-6 shadow">
        {success ? (
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg
                className="h-6 w-6 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900">Password Changed</h2>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been updated successfully.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={() => setSuccess(false)}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Change Again
              </button>
              <Link
                href="/admin/dashboard"
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-medium text-white hover:bg-green-800"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                placeholder="At least 6 characters"
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              />
            </div>

            {error && (
              <div className="rounded-md bg-red-50 p-3">
                <p className="text-sm text-red-600" role="alert">
                  {error}
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <Link
                href="/admin/dashboard"
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={loading}
                className="rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Security tips */}
      <div className="mt-6 rounded-lg bg-blue-50 p-4">
        <h3 className="text-sm font-medium text-blue-800">Password Tips</h3>
        <ul className="mt-2 list-inside list-disc text-xs text-blue-700 space-y-1">
          <li>Use at least 6 characters</li>
          <li>Mix uppercase and lowercase letters</li>
          <li>Include numbers and special characters</li>
          <li>Don&apos;t reuse passwords from other sites</li>
        </ul>
      </div>
    </div>
  );
}
