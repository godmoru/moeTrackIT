"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to send reset email");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
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
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Check your email</h1>
            <p className="mt-2 text-sm text-gray-600">
              If an account with that email exists, we&apos;ve sent a password reset link.
              Please check your inbox and spam folder.
            </p>
            <p className="mt-4 text-sm text-gray-500">
              The link will expire in 1 hour.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-block text-sm font-medium text-green-700 hover:text-green-800 hover:underline"
            >
              Back to login
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="text-center text-xl font-semibold text-gray-900">
          Forgot Password
        </h1>
        <p className="mt-1 text-center text-sm text-gray-600">
          Enter your email address and we&apos;ll send you a link to reset your password.
        </p>
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800 disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send reset link"}
          </button>
        </form>
        <div className="mt-4 text-center">
          <Link
            href="/login"
            className="text-sm text-gray-600 hover:text-gray-800 hover:underline"
          >
            Back to login
          </Link>
        </div>
      </div>
    </div>
  );
}
