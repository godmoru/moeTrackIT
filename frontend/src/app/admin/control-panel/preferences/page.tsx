"use client";

import { FormEvent, useEffect, useState } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

export default function PreferencesPage() {
  const [portalTitle, setPortalTitle] = useState("MOETrackIT - Revenue Monitor");
  const [invoiceFooter, setInvoiceFooter] = useState(
    "This receipt is only valid if generated from the official MOETrackIT platform."
  );
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      try {
        setLoading(true);
        setError(null);

        const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
        if (!token) {
          throw new Error("You are not authenticated. Please log in again.");
        }

        const res = await fetch(`${API_BASE}/settings`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          throw new Error(data.message || "Failed to load settings");
        }

        if (typeof data.portalTitle === "string") {
          setPortalTitle(data.portalTitle);
        }
        if (typeof data.invoiceFooter === "string") {
          setInvoiceFooter(data.invoiceFooter);
        }
      } catch (err: any) {
        setError(err.message || "Failed to load settings");
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      if (!token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const res = await fetch(`${API_BASE}/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ portalTitle, invoiceFooter }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        throw new Error(data.message || "Failed to save settings");
      }

      setSuccess("Settings saved successfully");
    } catch (err: any) {
      setError(err.message || "Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-lg font-semibold text-gray-900">System Preferences</h1>
        <p className="text-xs text-gray-500">
          Configure branding and other global settings for the admin portal.
        </p>
      </div>
      <div className="rounded-lg bg-white p-4 shadow-sm text-xs text-gray-700">
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="flex items-center justify-between">
            {loading && <p className="text-[11px] text-gray-500">Loading current settings...</p>}
            {error && (
              <p className="text-[11px] text-red-600" role="alert">
                {error}
              </p>
            )}
            {success && (
              <p className="text-[11px] text-green-700" role="status">
                {success}
              </p>
            )}
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-700">Portal title</label>
            <input
              type="text"
              value={portalTitle}
              onChange={(e) => setPortalTitle(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            />
            <p className="mt-1 text-[11px] text-gray-500">
              This title appears in the browser tab and can reflect the deployment (e.g.
              "Benue State Education Revenue Management").
            </p>
          </div>
          <div>
            <label className="block text-[11px] font-medium text-gray-700">Invoice footer text</label>
            <textarea
              value={invoiceFooter}
              onChange={(e) => setInvoiceFooter(e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-xs focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
              rows={3}
            />
            <p className="mt-1 text-[11px] text-gray-500">
              This text will be used as the declaration/footer on generated invoices and
              receipts.
            </p>
          </div>
          <div className="flex items-center justify-between pt-1">
            <p className="text-[11px] text-gray-500">
              Only <span className="font-medium">super_admin</span> users can change these
              settings. Other roles can view them.
            </p>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
