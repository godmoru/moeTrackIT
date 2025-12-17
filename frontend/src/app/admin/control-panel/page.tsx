"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

const sections = [
  {
    key: "roles",
    title: "Roles",
    description: "Define admin roles and what they can access in the portal.",
  },
  {
    key: "permissions",
    title: "Permissions",
    description: "Fine-tune which actions are allowed for each role.",
  },
  {
    key: "preferences",
    title: "Preferences",
    description: "Configure system-wide preferences like branding and invoice footer.",
  },
  {
    key: "users",
    title: "Users",
    description: "Manage admin users for this control panel.",
  },
  {
    key: "institution-types",
    title: "Institution Types",
    description: "Manage institution type classifications.",
  },
  {
    key: "institution-ownerships",
    title: "Institution Ownership",
    description: "Manage institution ownership structures.",
  },
  {
    key: "audit-logs",
    title: "Audit Logs",
    description: "View all system activities and user operations. Super Admin only.",
    superAdminOnly: true,
  },
];

export default function ControlPanelPage() {
  const { user } = useAuth();

  console.log('User role:', user?.role); // Debug line

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Control Panel</h1>
          <p className="text-xs text-gray-500">
            Manage roles, permissions, preferences and users for the admin portal.
          </p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {sections
          .filter((section) => !section.superAdminOnly || user?.role === "super_admin")
          .map((section) => (
            <Link
              key={section.key}
              href={
                section.key === "users"
                  ? "/admin/control-panel/users"
                  : section.key === "roles"
                  ? "/admin/control-panel/roles"
                  : section.key === "permissions"
                  ? "/admin/control-panel/permissions"
                  : section.key === "preferences"
                  ? "/admin/control-panel/preferences"
                  : section.key === "institution-types"
                  ? "/admin/control-panel/institution-types"
                  : section.key === "institution-ownerships"
                  ? "/admin/control-panel/institution-ownership"
                  : section.key === "audit-logs"
                  ? "/admin/control-panel/audit-logs"
                  : "#"
              }
            >
            <div className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                  {section.title}
                </h2>
                <p className="mt-2 text-xs text-gray-600">{section.description}</p>
              </div>
              <div className="mt-3 text-xs">
                View
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
