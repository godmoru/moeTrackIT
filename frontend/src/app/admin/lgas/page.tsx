"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Swal from "sweetalert2";
import { DataTable } from "@/components/ui/DataTable";

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
          <DataTable
            data={items}
            columns={[
              { header: "S/N", cell: (l, index) => <span className="text-xs">{index + 1}</span> },
              { header: "Name", cell: (l) => <span className="text-xs">{l.name}</span> },
              { header: "State", cell: (l) => <span className="text-xs">{l.state}</span> },
              { header: "Code", cell: (l) => <span className="text-xs">{l.code || "-"}</span> },
              {
                header: "Total Institutions",
                cell: (l) => {
                  const totalEntities = entities.filter(
                    (e) => (e.lga || "").toLowerCase() === l.name.toLowerCase()
                  ).length;
                  return <span className="text-xs">{totalEntities}</span>
                }
              },
              {
                header: "Total Revenue (NGN)",
                cell: (l) => {
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

                  return <span className="text-xs">₦{totalRevenue.toLocaleString("en-NG", { maximumFractionDigits: 2 })}</span>
                }
              },
              {
                header: "Actions",
                cell: (l) => (
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
                )
              }
            ]}
          />
          {/* Footer for grand total - manually added below DataTable because typical DataTables don't support footers easily */}
          <div className="bg-gray-50 p-4 border-t border-gray-200 mt-2 rounded">
            <div className="flex justify-between items-center text-xs font-semibold text-gray-800">
              <span>Grand Total Revenue</span>
              <span>
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
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
