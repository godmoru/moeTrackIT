"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api/v1";

interface Lga {
  id: number;
  name: string;
  state: string;
  code: string | null;
}

interface Entity {
  id: number;
  name: string;
  lga: string | null;
}

interface AssessmentLite {
  id: number;
  entityId: number;
}

interface PaymentLite {
  id: number;
  assessmentId: number;
  amountPaid: number;
}

export default function LgasPage() {
  const [items, setItems] = useState<Lga[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [assessments, setAssessments] = useState<AssessmentLite[]>([]);
  const [payments, setPayments] = useState<PaymentLite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const token =
          typeof window !== "undefined" ? localStorage.getItem("authToken") : null;

        const [lgasRes, entitiesRes, assessmentsRes, paymentsRes] = await Promise.all([
          fetch(`${API_BASE}/lgas`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/institutions`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/assessments`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
          fetch(`${API_BASE}/payments`, {
            headers: {
              "Content-Type": "application/json",
              ...(token ? { Authorization: `Bearer ${token}` } : {}),
            },
          }),
        ]);

        if (!lgasRes.ok || !entitiesRes.ok || !assessmentsRes.ok || !paymentsRes.ok) {
          const body = await lgasRes.json().catch(() => ({}));
          throw new Error(body.message || "Failed to load LGAs or related data");
        }

        const lgasBody = await lgasRes.json();
        const entitiesBody = await entitiesRes.json();
        const assessmentsBody = await assessmentsRes.json();
        const paymentsBody = await paymentsRes.json();

        setItems(lgasBody);
        setEntities(entitiesBody);
        setAssessments(assessmentsBody);
        setPayments(paymentsBody);
      } catch (err: any) {
        setError(err.message || "Failed to load LGAs");
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Benue State LGAs </h1>
      {loading && <p className="text-sm text-gray-600">Loading LGAs...</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
      {!loading && !error && (
        <div className="overflow-x-auto rounded-lg bg-white shadow-sm">
          <table className="min-w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-3 py-2 font-medium">S/N</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">State</th>
                <th className="px-3 py-2 font-medium">Code</th>
                <th className="px-3 py-2 font-medium">Total Institutions</th>
                <th className="px-3 py-2 font-medium">Total Revenue (NGN)</th>
                <th className="px-3 py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((l, index) => {
                const totalEntities = entities.filter(
                  (e) => (e.lga || "").toLowerCase() === l.name.toLowerCase()
                ).length;

                const lgaEntityIds = new Set(
                  entities
                    .filter((e) => (e.lga || "").toLowerCase() === l.name.toLowerCase())
                    .map((e) => e.id),
                );

                const assessmentToEntity = new Map<number, number>();
                assessments.forEach((a) => {
                  if (lgaEntityIds.has(a.entityId)) {
                    assessmentToEntity.set(a.id, a.entityId);
                  }
                });

                const totalRevenue = payments
                  .filter((p) => assessmentToEntity.has(p.assessmentId))
                  .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

                return (
                  <tr key={l.id} className="border-t text-gray-800">
                    <td className="px-3 py-2 text-xs">{index + 1}</td>
                    <td className="px-3 py-2 text-xs">{l.name}</td>
                    <td className="px-3 py-2 text-xs">{l.state}</td>
                    <td className="px-3 py-2 text-xs">{l.code || "-"}</td>
                    <td className="px-3 py-2 text-xs">{totalEntities}</td>
                    <td className="px-3 py-2 text-xs">
                      ₦{totalRevenue.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/lgas/${l.id}`}
                          className="rounded border border-gray-300 px-2 py-1 text-[10px] font-medium text-gray-700 hover:bg-gray-50"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          onClick={() =>
                            Swal.fire({
                              icon: "info",
                              title: "Edit LGA",
                              text: "Editing LGAs will be implemented later.",
                              confirmButtonColor: "#15803d",
                            })
                          }
                          className="rounded border border-blue-500 px-2 py-1 text-[10px] font-medium text-blue-600 hover:bg-blue-50"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            Swal.fire({
                              icon: "warning",
                              title: "Delete LGA",
                              text: "You are not authorized to delete an LGA.",
                              confirmButtonColor: "#b91c1c",
                            })
                          }
                          className="rounded border border-red-500 px-2 py-1 text-[10px] font-medium text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-50 text-gray-800">
              <tr>
                <td className="px-3 py-2 text-xs font-semibold" colSpan={4}>
                  Grand Total Revenue
                </td>
                <td className="px-3 py-2 text-xs font-semibold">
                  ₦{
                    items
                      .map((l) => {
                        const lgaEntityIds = new Set(
                          entities
                            .filter(
                              (e) => (e.lga || "").toLowerCase() === l.name.toLowerCase(),
                            )
                            .map((e) => e.id),
                        );

                        const assessmentToEntity = new Map<number, number>();
                        assessments.forEach((a) => {
                          if (lgaEntityIds.has(a.entityId)) {
                            assessmentToEntity.set(a.id, a.entityId);
                          }
                        });

                        const totalRevenue = payments
                          .filter((p) => assessmentToEntity.has(p.assessmentId))
                          .reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

                        return totalRevenue;
                      })
                      .reduce((sum, v) => sum + v, 0)
                      .toLocaleString("en-NG", { maximumFractionDigits: 2 })
                  }
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
