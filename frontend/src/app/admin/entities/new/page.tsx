"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface LgaOption {
  id: number;
  name: string;
}

interface EntityTypeOption {
  id: number;
  name: string;
}

interface EntityOwnershipOption {
  id: number;
  name: string;
}

export default function NewEntityPage() {
  const router = useRouter();

  const [lgas, setLgas] = useState<LgaOption[]>([]);
  const [entityTypes, setEntityTypes] = useState<EntityTypeOption[]>([]);
  const [ownerships, setOwnerships] = useState<EntityOwnershipOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [entityTypeId, setEntityTypeId] = useState("");
  const [entityOwnershipId, setEntityOwnershipId] = useState("");
  const [state, setState] = useState("Benue");
  const [lga, setLga] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [status, setStatus] = useState("active");
  const [code, setCode] = useState("");
  const [category, setCategory] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    async function loadLookups() {
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

        const [lgasRes, typesRes, ownershipsRes] = await Promise.all([
          fetch(`${API_BASE}/lgas`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/institution-types`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/institution-ownerships`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
        ]);

        if (!lgasRes.ok || !typesRes.ok || !ownershipsRes.ok) {
          const body = await lgasRes.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load lookups");
        }

        const lgasBody: LgaOption[] = await lgasRes.json();
        const typesBody: EntityTypeOption[] = await typesRes.json();
        const ownershipsBody: EntityOwnershipOption[] = await ownershipsRes.json();

        setLgas(lgasBody);
        setEntityTypes(typesBody);
        setOwnerships(ownershipsBody);
      } catch (err: any) {
        setError(err.message || "Failed to load lookups");
      }
    }
    loadLookups();
  }, []);

  useEffect(() => {
    // Autogenerate a simple code from the name on first entry
    if (!name) return;
    setCode((prev) => {
      if (prev) return prev;
      const base = name
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, "")
        .slice(0, 6);
      return base || "";
    });
  }, [name]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!name || !entityTypeId || !entityOwnershipId) {
      setError("Name, Type and Ownership are required");
      return;
    }

    const entityTypeIdNum = Number(entityTypeId);
    const entityOwnershipIdNum = Number(entityOwnershipId);
    if (Number.isNaN(entityTypeIdNum) || Number.isNaN(entityOwnershipIdNum)) {
      setError("Please select valid Type and Ownership");
      return;
    }

    setLoading(true);
    try {
      const token =
        typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`${API_BASE}/institutions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          name,
          entityTypeId: entityTypeIdNum,
          entityOwnershipId: entityOwnershipIdNum,
          state,
          lga: lga || null,
          contactPerson: contactPerson || null,
          contactPhone: contactPhone || null,
          contactEmail: contactEmail || null,
          status: status || "active",
          type: "school",
          subType: null,
          ownership: null,
          code: code || null,
          category: category || null,
          address: address || null,
        }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Failed to create entity");
      }

      router.push("/admin/institutions");
    } catch (err: any) {
      setError(err.message || "Failed to create entity");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">
          New Entity
          {code && (
            <span className="ml-2 text-xs font-normal text-gray-500">
              (Code: {code})
            </span>
          )}
        </h1>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg bg-white p-4 text-xs shadow-sm"
      >
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="School or Vendor name"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Ownership
            </label>
            <select
              value={entityOwnershipId}
              onChange={(e) => setEntityOwnershipId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="">-- Select Ownership --</option>
              {ownerships.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Type
            </label>
            <select
              value={entityTypeId}
              onChange={(e) => setEntityTypeId(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="">-- Select Type --</option>
              {entityTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Category (optional)
            </label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="e.g. Day, Boarding, Science"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              State
            </label>
            <input
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600 readonly"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              LGA
            </label>
            <select
              value={lga}
              onChange={(e) => setLga(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="">-- Select LGA --</option>
              {lgas.map((x) => (
                <option key={x.id} value={x.name}>
                  {x.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1 md:col-span-3">
            <label className="block text-[11px] font-medium text-gray-700">
              Address (optional)
            </label>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              rows={2}
              placeholder="Street, town, landmarks, etc."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Contact Person (optional)
            </label>
            <input
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Principal, proprietor, etc."
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Contact Phone (optional)
            </label>
            <input
              value={contactPhone}
              onChange={(e) => setContactPhone(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="Phone number"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Contact Email (optional)
            </label>
            <input
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
              placeholder="adikwu@edu.be.gov.ng"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-[11px] font-medium text-gray-700">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
            >
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>

        <div className="pt-2">
          <button
            type="submit"
            disabled={loading}
            className="rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
          >
            {loading ? "Creating..." : "Create Entity"}
          </button>
        </div>
      </form>
    </div>
  );
}
