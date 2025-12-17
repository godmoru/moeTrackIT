"use client";

import { useState } from "react";

export default function SettingsPage() {
  const [notifications, setNotifications] = useState({
    emailAlerts: true,
    paymentReminders: true,
    systemUpdates: false,
  });

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "Africa/Lagos",
    dateFormat: "DD/MM/YYYY",
  });

  const [saved, setSaved] = useState(false);

  function handleSave() {
    // In a real app, this would save to the backend
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your account preferences and notifications.
        </p>
      </div>

      {saved && (
        <div className="mb-4 rounded-md bg-green-50 p-4">
          <div className="flex">
            <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <p className="ml-3 text-sm font-medium text-green-800">
              Settings saved successfully!
            </p>
          </div>
        </div>
      )}

      {/* Notifications */}
      <div className="rounded-lg bg-white shadow mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Notifications</h2>
          <p className="mt-1 text-sm text-gray-500">
            Choose what notifications you want to receive.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Email Alerts</span>
              <p className="text-xs text-gray-500">Receive important alerts via email</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifications({ ...notifications, emailAlerts: !notifications.emailAlerts })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${
                notifications.emailAlerts ? "bg-green-700" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notifications.emailAlerts ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">Payment Reminders</span>
              <p className="text-xs text-gray-500">Get notified about upcoming payments</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifications({ ...notifications, paymentReminders: !notifications.paymentReminders })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${
                notifications.paymentReminders ? "bg-green-700" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notifications.paymentReminders ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-900">System Updates</span>
              <p className="text-xs text-gray-500">Receive notifications about system updates</p>
            </div>
            <button
              type="button"
              onClick={() => setNotifications({ ...notifications, systemUpdates: !notifications.systemUpdates })}
              className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-700 focus:ring-offset-2 ${
                notifications.systemUpdates ? "bg-green-700" : "bg-gray-200"
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  notifications.systemUpdates ? "translate-x-5" : "translate-x-0"
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Preferences */}
      <div className="rounded-lg bg-white shadow mb-6">
        <div className="border-b border-gray-200 px-6 py-4">
          <h2 className="text-lg font-medium text-gray-900">Preferences</h2>
          <p className="mt-1 text-sm text-gray-500">
            Customize your experience.
          </p>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Language</label>
            <select
              value={preferences.language}
              onChange={(e) => setPreferences({ ...preferences, language: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="ha">Hausa</option>
              <option value="ig">Igbo</option>
              <option value="yo">Yoruba</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Timezone</label>
            <select
              value={preferences.timezone}
              onChange={(e) => setPreferences({ ...preferences, timezone: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="Africa/Lagos">West Africa Time (WAT)</option>
              <option value="UTC">UTC</option>
              <option value="Europe/London">London (GMT)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date Format</label>
            <select
              value={preferences.dateFormat}
              onChange={(e) => setPreferences({ ...preferences, dateFormat: e.target.value })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-green-700 focus:outline-none focus:ring-1 focus:ring-green-700"
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>

      {/* Save button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-md bg-green-700 px-6 py-2 text-sm font-semibold text-white hover:bg-green-800"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
