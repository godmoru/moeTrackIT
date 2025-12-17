"use client";

import { useEffect, useState } from "react";
import {
  SuperAdminDashboard,
  AdminDashboard,
  SystemAdminDashboard,
  OfficerDashboard,
  CashierDashboard,
  AEODashboard,
  PrincipalDashboard,
} from "@/components/dashboards";

// type UserRole = 
//   | "super_admin" 
//   | "admin" 
//   | "system_admin" 
//   | "officer" 
//   | "cashier" 
//   | "account_officer"
//   | "area_education_officer" 
//   | "principal" 
//   | string;


type UserRole = 
'super_admin' 
| 'system_admin' 
| 'admin' 
| 'hon_commissioner' 
| 'perm_secretary' 
| 'dfa' 
| 'director' 
| 'principal' 
| 'area_education_officer' 
| 'officer' 
| 'hq_cashier' 
| 'cashier' 
| 'user' 
| string;


export default function AdminDashboardPage() {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = localStorage.getItem("authToken");
    if (!token) {
      setLoading(false);
      return;
    }

    // Decode JWT to get user role
    try {
      const parts = token.split(".");
      if (parts.length === 3) {
        const payload = JSON.parse(atob(parts[1]));
        if (payload && payload.role) {
          setUserRole(payload.role);
        }
      }
    } catch {
      // If decoding fails, default to officer dashboard
      setUserRole("officer");
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
      </div>
    );
  }

  // Render role-specific dashboard
  switch (userRole) {
    case "super_admin":
      return <SuperAdminDashboard />;
    case "admin":
      return <AdminDashboard />;
    case "system_admin":
      return <SystemAdminDashboard />;
    case "officer":
      return <OfficerDashboard />;
    case "cashier":
    case "account_officer":
      return <CashierDashboard />;
    case "area_education_officer":
      return <AEODashboard />;
    case "principal":
      return <PrincipalDashboard />;
    default:
      // Default to officer dashboard for unknown roles
      return <OfficerDashboard />;
  }
}
