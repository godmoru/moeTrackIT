"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";

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

interface Entity {
    id: number;
    name: string;
    code: string | null;
    entityTypeId: number | null;
    entityOwnershipId: number | null;
    state: string | null;
    lga: string | null;
    lgaId: number | null;
    contactPerson: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    status: string;
    category: string | null;
    address: string | null;
}

export default function EditEntityPage() {
    const router = useRouter();
    const params = useParams();
    const id = params?.id as string | undefined;

    const [entity, setEntity] = useState<Entity | null>(null);
    const [lgas, setLgas] = useState<LgaOption[]>([]);
    const [entityTypes, setEntityTypes] = useState<EntityTypeOption[]>([]);
    const [ownerships, setOwnerships] = useState<EntityOwnershipOption[]>([]);
    const [loading, setLoading] = useState(false);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [name, setName] = useState("");
    const [entityTypeId, setEntityTypeId] = useState("");
    const [entityOwnershipId, setEntityOwnershipId] = useState("");
    const [state, setState] = useState("Benue");
    const [lga, setLga] = useState("");
    const [lgaId, setLgaId] = useState("");
    const [contactPerson, setContactPerson] = useState("");
    const [contactPhone, setContactPhone] = useState("");
    const [contactEmail, setContactEmail] = useState("");
    const [status, setStatus] = useState("active");
    const [code, setCode] = useState("");
    const [category, setCategory] = useState("");
    const [address, setAddress] = useState("");

    useEffect(() => {
        if (!id) return;

        async function loadData() {
            setLoadingData(true);
            try {
                const token =
                    typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

                const [entityRes, lgasRes, typesRes, ownershipsRes] = await Promise.all([
                    fetch(`${API_BASE}/institutions/${id}`, {
                        headers: {
                            "Content-Type": "application/json",
                            ...(token ? { Authorization: `Bearer ${token}` } : {}),
                        },
                    }),
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

                if (!entityRes.ok || !lgasRes.ok || !typesRes.ok || !ownershipsRes.ok) {
                    const body = await entityRes.json().catch(() => ({}));
                    throw new Error(body.message || "Failed to load data");
                }

                const entityBody: Entity = await entityRes.json();
                const lgasBody: LgaOption[] = await lgasRes.json();
                const typesBody: EntityTypeOption[] = await typesRes.json();
                const ownershipsBody: EntityOwnershipOption[] = await ownershipsRes.json();

                setEntity(entityBody);
                setLgas(lgasBody);
                setEntityTypes(typesBody);
                setOwnerships(ownershipsBody);

                // Populate form fields
                setName(entityBody.name || "");
                setEntityTypeId(entityBody.entityTypeId?.toString() || "");
                setEntityOwnershipId(entityBody.entityOwnershipId?.toString() || "");
                setState(entityBody.state || "Benue");
                setLga(entityBody.lga || "");
                setLgaId(entityBody.lgaId?.toString() || "");
                setContactPerson(entityBody.contactPerson || "");
                setContactPhone(entityBody.contactPhone || "");
                setContactEmail(entityBody.contactEmail || "");
                setStatus(entityBody.status || "active");
                setCode(entityBody.code || "");
                setCategory(entityBody.category || "");
                setAddress(entityBody.address || "");
            } catch (err: any) {
                setError(err.message || "Failed to load entity data");
            } finally {
                setLoadingData(false);
            }
        }
        loadData();
    }, [id]);

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
            const res = await fetch(`${API_BASE}/institutions/${id}`, {
                method: "PUT",
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
                    lgaId: lgaId ? Number(lgaId) : null,
                    contactPerson: contactPerson || null,
                    contactPhone: contactPhone || null,
                    contactEmail: contactEmail || null,
                    status: status || "active",
                    code: code || null,
                    category: category || null,
                    address: address || null,
                }),
            });

            if (!res.ok) {
                const body = await res.json().catch(() => ({}));
                throw new Error(body.message || "Failed to update entity");
            }

            router.push(`/admin/institutions/${id}`);
        } catch (err: any) {
            setError(err.message || "Failed to update entity");
        } finally {
            setLoading(false);
        }
    }

    if (loadingData) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-gray-600">Loading entity data...</p>
            </div>
        );
    }

    if (!entity) {
        return (
            <div className="space-y-4">
                <p className="text-sm text-red-600">Entity not found</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h1 className="text-lg font-semibold text-gray-900">
                    Edit Entity
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
                    Cancel
                </button>
            </div>

            {error && (
                <div className="rounded-md bg-red-50 border border-red-200 p-3">
                    <p className="text-sm text-red-600" role="alert">
                        {error}
                    </p>
                </div>
            )}

            <form
                onSubmit={handleSubmit}
                className="space-y-3 rounded-lg bg-white p-4 text-xs shadow-sm"
            >
                <div className="grid gap-3 md:grid-cols-3">
                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-700">
                            Name <span className="text-red-500">*</span>
                        </label>
                        <input
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                            placeholder="School or Vendor name"
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-700">
                            Ownership <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={entityOwnershipId}
                            onChange={(e) => setEntityOwnershipId(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                            required
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
                            Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={entityTypeId}
                            onChange={(e) => setEntityTypeId(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                            required
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
                            Code
                        </label>
                        <input
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                            placeholder="Institution code"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-700">
                            Category
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
                            Status
                        </label>
                        <select
                            value={status}
                            onChange={(e) => setStatus(e.target.value)}
                            className="w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                        >
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
                            <option value="suspended">Suspended</option>
                        </select>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-700">
                            State
                        </label>
                        <input
                            value={state}
                            onChange={(e) => setState(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-700">
                            LGA
                        </label>
                        <select
                            value={lga}
                            onChange={(e) => {
                                const selectedLga = lgas.find(x => x.name === e.target.value);
                                setLga(e.target.value);
                                setLgaId(selectedLga ? selectedLga.id.toString() : "");
                            }}
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
                            Address
                        </label>
                        <textarea
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                            rows={2}
                            placeholder="Street, town, landmarks, etc."
                        />
                    </div>

                    <div className="space-y-1 md:col-span-3 border-t pt-3">
                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                            Contact Information
                            <span className="ml-2 text-xs font-normal text-gray-500">
                                (Required to create principal login account)
                            </span>
                        </h3>
                    </div>

                    <div className="space-y-1">
                        <label className="block text-[11px] font-medium text-gray-700">
                            Contact Person
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
                            Contact Phone
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
                            Contact Email
                        </label>
                        <input
                            type="email"
                            value={contactEmail}
                            onChange={(e) => setContactEmail(e.target.value)}
                            className="w-full rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 focus:border-green-600 focus:outline-none focus:ring-1 focus:ring-green-600"
                            placeholder="principal@school.edu.ng"
                        />
                    </div>
                </div>

                <div className="pt-2 flex gap-3">
                    <button
                        type="submit"
                        disabled={loading}
                        className="rounded-md bg-green-700 px-4 py-2 text-xs font-semibold text-white hover:bg-green-800 disabled:opacity-70"
                    >
                        {loading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                        type="button"
                        onClick={() => router.push(`/admin/institutions/${id}`)}
                        className="rounded-md border border-gray-300 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Cancel
                    </button>
                </div>

                {contactPerson && contactEmail && contactPhone && (
                    <div className="mt-3 rounded-md bg-blue-50 border border-blue-200 p-3">
                        <p className="text-xs text-blue-800">
                            <strong>Note:</strong> When you save, a principal user account will be created/updated with these contact details. The principal will be able to log in to manage this institution.
                        </p>
                    </div>
                )}
            </form>
        </div>
    );
}
