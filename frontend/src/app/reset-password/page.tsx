"use client";

import { FormEvent, useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Verify token on mount
  useEffect(() => {
    async function verifyToken() {
      if (!token) {
        setVerifying(false);
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/auth/verify-reset-token?token=${token}`);
        const data = await res.json();

        if (res.ok && data.valid) {
          setTokenValid(true);
          setUserEmail(data.email || null);
        } else {
          setError(data.message || "Invalid or expired reset link");
        }
      } catch (err) {
        setError("Failed to verify reset link");
      } finally {
        setVerifying(false);
      }
    }

    verifyToken();
  }, [token]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to reset password");
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  }

  // Loading state
  if (verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
            <p className="text-sm text-gray-600">Verifying reset link...</p>
          </div>
        </div>
      </div>
    );
  }

  // No token provided
  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Invalid Link</h1>
            <p className="mt-2 text-sm text-gray-600">
              No reset token provided. Please request a new password reset link.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-block rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Invalid or expired token
  if (!tokenValid && !verifying) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
              <svg
                className="h-6 w-6 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Link Expired</h1>
            <p className="mt-2 text-sm text-gray-600">
              {error || "This password reset link has expired or is invalid."}
            </p>
            <p className="mt-2 text-sm text-gray-500">
              Please request a new password reset link.
            </p>
            <Link
              href="/forgot-password"
              className="mt-6 inline-block rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Request new link
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900">Password Reset Successful</h1>
            <p className="mt-2 text-sm text-gray-600">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <button
              onClick={() => router.push("/login")}
              className="mt-6 inline-block rounded-md bg-green-700 px-4 py-2 text-sm font-semibold text-white hover:bg-green-800"
            >
              Go to login
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Reset password form
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
        <h1 className="text-center text-xl font-semibold text-gray-900">
          Reset Password
        </h1>
        {userEmail && (
          <p className="mt-1 text-center text-sm text-gray-600">
            for {userEmail}
          </p>
        )}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              placeholder="At least 6 characters"
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              placeholder="Repeat your password"
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
            {loading ? "Resetting..." : "Reset Password"}
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

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-gray-50">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow">
            <div className="text-center">
              <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
              <p className="text-sm text-gray-600">Loading...</p>
            </div>
          </div>
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
