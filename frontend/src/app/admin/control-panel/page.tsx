"use client";

import Link from "next/link";

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
];

export default function ControlPanelPage() {
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
        {sections.map((section) => (
          <div key={section.key} className="flex flex-col justify-between rounded-lg bg-white p-4 shadow-sm">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {section.title}
              </h2>
              <p className="mt-2 text-xs text-gray-600">{section.description}</p>
            </div>
            <div className="mt-3 text-xs">
              <Link
                href={`/admin/control-panel/${section.key}`}
                className="inline-flex items-center rounded-md border border-gray-300 px-3 py-1 font-medium text-gray-700 hover:bg-gray-50"
              >
                Configure
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
