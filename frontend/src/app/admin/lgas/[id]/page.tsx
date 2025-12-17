"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { YearlyRevenueBar, RevenueBySourcePie } from "@/components/Charts";

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
  assessmentPeriod?: string | null;
  incomeSourceId?: number | null;
  IncomeSource?: { name: string } | null;
}

interface PaymentLite {
  id: number;
  assessmentId: number;
  amountPaid: number;
  paymentDate?: string | null;
}

export default function LgaProfilePage() {
  const params = useParams();
  const router = useRouter();
  const lgaId = Number(params?.id);

  const [lga, setLga] = useState<Lga | null>(null);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [assessments, setAssessments] = useState<AssessmentLite[]>([]);
  const [payments, setPayments] = useState<PaymentLite[]>([]);
  const [activeTab, setActiveTab] = useState<"revenue" | "entities" | "years">("revenue");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lgaId || Number.isNaN(lgaId)) {
      setError("Invalid LGA id");
      setLoading(false);
      return;
    }

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
          throw new Error(body.message || "Failed to load LGA profile data");
        }

        const lgasBody: Lga[] = await lgasRes.json();
        const entitiesBody: Entity[] = await entitiesRes.json();
        const assessmentsBody: AssessmentLite[] = await assessmentsRes.json();
        const paymentsBody: PaymentLite[] = await paymentsRes.json();

        const currentLga = lgasBody.find((x) => x.id === lgaId) || null;
        if (!currentLga) {
          throw new Error("LGA not found");
        }

        setLga(currentLga);
        setEntities(entitiesBody);
        setAssessments(assessmentsBody);
        setPayments(paymentsBody);
      } catch (err: any) {
        setError(err.message || "Failed to load LGA profile data");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [lgaId]);

  if (!lgaId || Number.isNaN(lgaId)) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-red-600">Invalid LGA id.</p>
      </div>
    );
  }

  const lgaEntities = entities.filter(
    (e) => (e.lga || "").toLowerCase() === (lga?.name || "").toLowerCase(),
  );
  const lgaEntityIds = new Set(lgaEntities.map((e) => e.id));

  const lgaAssessments = assessments.filter((a) => lgaEntityIds.has(a.entityId));
  const lgaAssessmentIds = new Set(lgaAssessments.map((a) => a.id));

  const lgaPayments = payments.filter((p) => lgaAssessmentIds.has(p.assessmentId));

  const totalRevenue = lgaPayments.reduce((sum, p) => sum + Number(p.amountPaid || 0), 0);

  const yearlyRevenueMap = new Map<string, number>();
  lgaAssessments.forEach((a) => {
    const year = (a.assessmentPeriod || "").toString() || "Unknown";
    const relatedPayments = lgaPayments.filter((p) => p.assessmentId === a.id);
    const sumForAssessment = relatedPayments.reduce(
      (s, p) => s + Number(p.amountPaid || 0),
      0,
    );
    const prev = yearlyRevenueMap.get(year) || 0;
    yearlyRevenueMap.set(year, prev + sumForAssessment);
  });

  const yearlyRows = Array.from(yearlyRevenueMap.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  );

  const yearlyLabels = yearlyRows.map(([year]) => year);
  const yearlyValues = yearlyRows.map(([_, amt]) => Number(amt || 0));

  const revenueBySourceMap = new Map<string, number>();
  lgaAssessments.forEach((a) => {
    const label = a.IncomeSource?.name || "Unknown";
    const relatedPayments = lgaPayments.filter((p) => p.assessmentId === a.id);
    const sumForAssessment = relatedPayments.reduce(
      (s, p) => s + Number(p.amountPaid || 0),
      0,
    );
    const prev = revenueBySourceMap.get(label) || 0;
    revenueBySourceMap.set(label, prev + sumForAssessment);
  });

  const revenueBySourceLabels = Array.from(revenueBySourceMap.keys());
  const revenueBySourceValues = Array.from(revenueBySourceMap.values());

  // Dynamic list of the last 6 years (including current year), newest first
  const currentYear = new Date().getFullYear();
  const entityYearColumns = Array.from({ length: 6 }, (_, i) => String(currentYear - i));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">
            {lga?.name || "LGA"} Local Government Profile
          </h1>
          {lga && (
            <p className="text-xs text-gray-600">
              State: {lga.state} &middot; Code: {lga.code || "-"}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>
      </div>

      {loading && <p className="text-sm text-gray-600">Loading LGA details...</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!loading && !error && (
        <>
          <div className="flex gap-2 border-b border-gray-200 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("revenue")}
              className={`border-b-2 px-3 py-2 font-medium ${
                activeTab === "revenue"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Revenue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("entities")}
              className={`border-b-2 px-3 py-2 font-medium ${
                activeTab === "entities"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Institutions
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("years")}
              className={`border-b-2 px-3 py-2 font-medium ${
                activeTab === "years"
                  ? "border-green-700 text-green-700"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              Yearly Remittances
            </button>
          </div>

          {activeTab === "revenue" && (
            <>
              <div className="mt-4 grid gap-4 md:grid-cols-3">
                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Total Revenue (NGN)
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-green-700">
                    ₦{totalRevenue.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Total Institutions
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {lgaEntities.length}
                  </div>
                </div>

                <div className="rounded-lg bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Total Payments
                  </div>
                  <div className="mt-2 text-2xl font-semibold text-gray-900">
                    {lgaPayments.length}
                  </div>
                </div>
              </div>

              {yearlyLabels.length > 0 && (
                <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                  <YearlyRevenueBar labels={yearlyLabels} values={yearlyValues} />
                </div>
              )}

              {revenueBySourceLabels.length > 0 && (
                <div className="mt-4 rounded-lg bg-white p-4 shadow-sm">
                  <RevenueBySourcePie
                    title="Revenue by Income Source"
                    labels={revenueBySourceLabels}
                    values={revenueBySourceValues}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === "entities" && (
            <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
              <table className="min-w-full text-left text-xs">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-3 py-2 font-medium">S/N</th>
                    <th className="px-3 py-2 font-medium">Name</th>
                    {/* Last 5+ Years payments per entity (static years 2020-2025) */}
                    {entityYearColumns.map((year) => (
                      <th key={year} className="px-3 py-2 font-medium">
                        {year}
                      </th>
                    ))}
                    <th className="px-3 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {lgaEntities.length === 0 && (
                    <tr>
                      <td className="px-3 py-2 text-xs text-gray-500" colSpan={2}>
                        No institutions found for this LGA.
                      </td>
                    </tr>
                  )}
                  {lgaEntities.map((e, index) => (
                    <tr key={e.id} className="border-t text-gray-800">
                      <td className="px-3 py-2 text-xs">{index + 1}</td>
                      <td className="px-3 py-2 text-xs">{e.name}</td>
                      {(() => {
                        const sums: Record<string, number> = {};
                        entityYearColumns.forEach((y) => {
                          sums[y] = 0;
                        });

                        const entityAssessments = lgaAssessments.filter(
                          (a) => a.entityId === e.id,
                        );

                        entityAssessments.forEach((a) => {
                          const year = (a.assessmentPeriod || "").toString();
                          if (!entityYearColumns.includes(year)) return;

                          const relatedPayments = lgaPayments.filter(
                            (p) => p.assessmentId === a.id,
                          );
                          const sumForAssessment = relatedPayments.reduce(
                            (s, p) => s + Number(p.amountPaid || 0),
                            0,
                          );
                          sums[year] += sumForAssessment;
                        });

                        const totalForEntity = entityYearColumns.reduce(
                          (acc, y) => acc + (sums[y] || 0),
                          0,
                        );

                        return (
                          <>
                            {entityYearColumns.map((year) => (
                              <td key={year} className="px-3 py-2 text-xs">
                                {sums[year]
                                  ? `₦${sums[year].toLocaleString("en-NG", {
                                      maximumFractionDigits: 2,
                                    })}`
                                  : "-"}
                              </td>
                            ))}
                            <td className="px-3 py-2 text-xs font-semibold">
                              ₦{totalForEntity.toLocaleString("en-NG", {
                                maximumFractionDigits: 2,
                              })}
                            </td>
                          </>
                        );
                      })()}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === "years" && (
            <div className="mt-4 overflow-x-auto rounded-lg bg-white shadow-sm">
              <div className="p-4">
                {yearlyRows.length > 0 && (
                  <div className="mb-4 space-y-2">
                    <div className="text-xs font-medium text-gray-700">
                      Revenue by Year (Bar Approximation)
                    </div>
                    {(() => {
                      const max = Math.max(
                        ...yearlyRows.map(([_, amt]) => Number(amt || 0)),
                        1,
                      );
                      return yearlyRows.map(([year, amt]) => {
                        const value = Number(amt || 0);
                        const width = `${Math.max((value / max) * 100, 4)}%`;
                        return (
                          <div
                            key={year}
                            className="flex items-center gap-2 text-[11px] text-gray-700"
                          >
                            <div className="w-12 font-medium">{year}</div>
                            <div className="flex-1 rounded-full bg-gray-100">
                              <div
                                className="rounded-full bg-green-600 py-1 text-right text-[10px] text-white pr-2"
                                style={{ width }}
                              >
                                ₦{value.toLocaleString("en-NG", {
                                  maximumFractionDigits: 0,
                                })}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}

                <table className="min-w-full text-left text-xs">
                  <thead className="bg-gray-50 text-gray-600">
                    <tr>
                      <th className="px-3 py-2 font-medium">Year</th>
                      <th className="px-3 py-2 font-medium">Total Revenue (NGN)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {yearlyRows.length === 0 && (
                      <tr>
                        <td className="px-3 py-2 text-xs text-gray-500" colSpan={2}>
                          No remittances recorded yet for this LGA.
                        </td>
                      </tr>
                    )}
                    {yearlyRows.map(([year, amt]) => (
                      <tr key={year} className="border-t text-gray-800">
                        <td className="px-3 py-2 text-xs">{year}</td>
                        <td className="px-3 py-2 text-xs">
                          ₦{amt.toLocaleString("en-NG", { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
