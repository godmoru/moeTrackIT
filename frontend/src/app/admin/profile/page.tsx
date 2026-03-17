"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { DataTable } from "@/components/ui/DataTable";
import { useAuth } from "@/contexts/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface ActivityLog {
  id: number;
  action: string;
  entity: string;
  details: string;
  timestamp: string;
  ipAddress?: string;
}

interface Permission {
  module: string;
  actions: string[];
}

export default function ProfilePage() {
  const { user: authUser, setUser: setAuthUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"profile" | "activity" | "permissions" | "security" | "settings">("profile");
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync profile image state with AuthContext
  useEffect(() => {
    if (authUser?.profileImage) {
      setProfileImage(authUser.profileImage);
    }
  }, [authUser]);

  const userInfo = authUser ? {
    id: Number(authUser.id),
    name: authUser.name,
    email: authUser.email,
    role: authUser.role,
    phone: "Not provided",
    department: "Education",
    lga: authUser.role === "area_education_officer" ? (authUser.lga || "Not assigned") : authUser.role.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    createdAt: "2024-01-01",
    lastLogin: new Date().toISOString(),
    profileImage: authUser.profileImage,
  } : null;

  if (authLoading || !userInfo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-green-700 border-t-transparent"></div>
      </div>
    );
  }

  const initials = userInfo.name
    ? userInfo.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size should be less than 5MB');
      return;
    }

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('profileImage', file);

      const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000/api/v1';
      const token = localStorage.getItem('authToken');
      const uploadUrl = `${API_BASE}/users/${userInfo!.id}/profile-image`;
      
      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      const baseUrl = API_BASE.split('/api/v1')[0];
      const fullImageUrl = `${baseUrl}${data.profileImage}`;
      
      if (authUser) {
        setAuthUser({
          ...authUser,
          profileImage: fullImageUrl
        });
      }
      setProfileImage(fullImageUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert(error instanceof Error ? error.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const tabs: { id: "profile" | "activity" | "permissions" | "security" | "settings"; label: string; icon: string }[] = [
    { id: "profile", label: "Profile", icon: "user" },
    { id: "activity", label: "Activity Log", icon: "clock" },
    { id: "permissions", label: "Permissions", icon: "shield" },
    { id: "security", label: "Security", icon: "lock" },
    { id: "settings", label: "Settings", icon: "cog" },
  ];

  const activityLogs: ActivityLog[] = [
    { id: 1, action: "Login", entity: "Auth", details: "Successful login from MacOS", timestamp: "2024-03-20 10:30 AM", ipAddress: "192.168.1.100" },
    { id: 2, action: "Upload", entity: "Profile", details: "Updated profile picture", timestamp: "2024-03-19 04:15 PM", ipAddress: "192.168.1.105" },
  ];

  const permissions: Permission[] = [
    { module: "Assessments", actions: ["view", "create", "edit"] },
    { module: "Institutions", actions: ["view", "search"] },
    { module: "Reports", actions: ["view", "export"] },
  ];

  return (
    <div className="min-h-screen bg-[#f8faf9] text-gray-900 selection:bg-green-100 selection:text-green-900">
      {/* Premium Hero Section */}
      <div className="relative overflow-hidden bg-[#0a2e1f] pb-32 pt-12">
        {/* Animated background elements */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute -top-24 -left-24 w-96 h-96 bg-green-500 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute top-1/2 -right-24 w-80 h-80 bg-emerald-600 rounded-full blur-[100px] animate-pulse delay-700"></div>
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="flex flex-col md:flex-row items-center md:items-end gap-8">
            {/* Avatar Section */}
            <div className="group relative">
              <div className="absolute -inset-1.5 bg-gradient-to-tr from-emerald-400 to-green-600 rounded-full blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
              <button
                onClick={handleAvatarClick}
                className="relative flex h-32 w-32 items-center justify-center rounded-full bg-white ring-4 ring-[#0a2e1f] shadow-2xl overflow-hidden hover:scale-105 transition-transform duration-300 cursor-pointer"
                disabled={isUploading}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent"></div>
                  </div>
                ) : profileImage || userInfo?.profileImage ? (
                  <img
                    src={profileImage || userInfo?.profileImage}
                    alt="Profile"
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                ) : (
                  <span className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-emerald-600 to-green-800">
                    {initials}
                  </span>
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  </svg>
                </div>
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </div>

            {/* User Bio Section */}
            <div className="flex-1 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-widest mb-4">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Active Member
              </div>
              <h1 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight mb-2">
                {userInfo.name}
              </h1>
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-y-2 gap-x-6 text-emerald-100/80 font-medium">
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  {userInfo.email}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  {userInfo.department}
                </span>
                <span className="flex items-center gap-2">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {userInfo.lga}
                </span>
              </div>
            </div>

            <div className="flex gap-3">
              <button className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold shadow-lg shadow-emerald-900/40 transition-all hover:-translate-y-0.5 active:translate-y-0">
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic Tabs Section */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-20 relative z-20">
        <div className="bg-white/80 backdrop-blur-xl border border-white/40 rounded-[2rem] shadow-2xl p-4 md:p-8">
          <div className="flex overflow-x-auto pb-4 md:pb-0 hide-scrollbar scroll-smooth">
            <div className="flex gap-2 min-w-max">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-sm font-bold transition-all duration-300 ${
                    activeTab === tab.id
                      ? "bg-emerald-600 text-white shadow-xl shadow-emerald-200"
                      : "text-gray-500 hover:bg-emerald-50 hover:text-emerald-600"
                  }`}
                >
                  <TabIcon name={tab.icon} />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {activeTab === "profile" && (
                <motion.div
                  key="profile"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className="grid gap-8 lg:grid-cols-12"
                >
                  <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-xl transition-all duration-500">
                      <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gradient-to-r from-gray-50/50 to-white">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                          <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                            <TabIcon name="user" />
                          </div>
                          Personal Information
                        </h3>
                        <button className="text-sm font-bold text-emerald-600 hover:text-emerald-700 transition-colors">Update</button>
                      </div>
                      <div className="p-8 grid gap-8 md:grid-cols-2">
                        <InfoField label="Full Name" value={userInfo.name} icon="user" />
                        <InfoField label="Email Address" value={userInfo.email} icon="mail" />
                        <InfoField label="Phone Number" value={userInfo.phone} icon="phone" />
                        <InfoField label="Department" value={userInfo.department} icon="office" />
                        <div className={`md:col-span-2 p-5 rounded-2xl border transition-all duration-300 ${userInfo.role === "area_education_officer" ? "bg-amber-50/50 border-amber-100" : "bg-emerald-50/50 border-emerald-100"}`}>
                          <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">
                            {userInfo.role === "area_education_officer" ? "Assigned Location (LGA)" : "Access Role"}
                          </label>
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${userInfo.role === "area_education_officer" ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"}`}>
                              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                            </div>
                            <div>
                               <p className="font-bold text-gray-900">{userInfo.lga}</p>
                               {userInfo.role === "area_education_officer" ? (
                                 <p className="text-xs text-amber-700 font-medium">Area Education Officer jurisdiction</p>
                               ) : (
                                 <p className="text-xs text-emerald-700 font-medium">System access level</p>
                               )}
                             </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="grid gap-4 md:grid-cols-4">
                      <StatCard label="Assessments" value="127" color="emerald" icon="document" />
                      <StatCard label="Payments" value="45" color="blue" icon="credit-card" />
                      <StatCard label="Reports" value="12" color="purple" icon="chart" />
                      <StatCard label="Efficiency" value="89%" color="orange" icon="lightning" />
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0a2e1f] rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
                      <h3 className="text-xl font-bold mb-6 relative z-10">Profile Completion</h3>
                      <div className="space-y-6 relative z-10">
                        <div className="flex justify-between items-end mb-2">
                          <span className="text-4xl font-black text-emerald-400">85%</span>
                          <span className="text-emerald-100/60 text-sm font-bold">Almost there!</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden">
                          <div className="h-full w-[85%] bg-gradient-to-r from-emerald-400 to-green-300 rounded-full shadow-[0_0_20px_rgba(52,211,153,0.5)]"></div>
                        </div>
                        <ul className="space-y-3">
                          <li className="flex items-center gap-3 text-sm font-medium text-emerald-50/80">
                            <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Verified Email
                          </li>
                          <li className="flex items-center gap-3 text-sm font-medium text-emerald-50/80">
                            <svg className="h-5 w-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                            Profile Picture
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "activity" && (
                <motion.div
                  key="activity"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6"
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                      <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <TabIcon name="clock" />
                      </div>
                      Activity Log
                    </h3>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                    <DataTable
                      data={activityLogs}
                      columns={[
                        { header: "Action", cell: (log) => <span className="font-bold text-gray-900">{log.action}</span> },
                        { header: "Entity", cell: (log) => <span className="text-gray-500 font-medium">{log.entity}</span> },
                        { header: "Details", cell: (log) => <span className="text-gray-600">{log.details}</span> },
                        { header: "Timestamp", cell: (log) => <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">{log.timestamp}</span> },
                      ]}
                    />
                  </div>
                </motion.div>
              )}

              {activeTab === "permissions" && (
                <motion.div
                  key="permissions"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-3 mb-6">
                    <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                      <TabIcon name="shield" />
                    </div>
                    Role Permissions
                  </h3>
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {permissions.map((perm) => (
                      <div key={perm.module} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300">
                        <h4 className="font-bold text-gray-900 mb-4">{perm.module}</h4>
                        <div className="flex flex-wrap gap-2">
                          {perm.actions.map((action) => (
                            <span key={action} className="inline-flex items-center rounded-lg bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-700 border border-emerald-100">
                              {action}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {activeTab === "security" && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-8 lg:grid-cols-2"
                >
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all duration-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Password Management</h3>
                    <p className="text-gray-500 mb-8">Improve your security by using a strong password.</p>
                    <Link href="/admin/change-password" title="Change Password" className="px-6 py-3 bg-gray-900 text-white rounded-xl font-bold">Change Password</Link>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all duration-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-3">
                       <div className="p-2 bg-emerald-100 rounded-lg text-emerald-600">
                        <TabIcon name="lock" />
                      </div>
                      Active Sessions
                    </h3>
                    <div className="space-y-4">
                      <HistoryItem date="Today, 10:30 AM" device="MacOS • Chrome" status="Success" />
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === "settings" && (
                <motion.div
                  key="settings"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid gap-8 lg:grid-cols-2"
                >
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all duration-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-8">Profile Preferences</h3>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block ml-1">Full Name</label>
                        <input type="text" value={userInfo.name} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 transition-all outline-none" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-widest block ml-1">Phone Number</label>
                        <input type="tel" value={userInfo.phone} className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 text-sm font-medium focus:ring-2 focus:ring-emerald-500 transition-all outline-none" />
                      </div>
                      <button className="w-full rounded-2xl bg-emerald-600 text-white px-6 py-4 text-sm font-black uppercase tracking-widest">Save Changes</button>
                    </div>
                  </div>
                  <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 hover:shadow-xl transition-all duration-500">
                    <h3 className="text-xl font-bold text-gray-900 mb-8">Notification Control</h3>
                    <div className="space-y-2">
                      <ToggleField label="Email Notifications" defaultChecked />
                      <ToggleField label="SMS Notifications" />
                    </div>
                  </div>
                  {userInfo.role === "area_education_officer" && (
                    <div className="bg-amber-50/50 border border-amber-100 rounded-3xl p-8 lg:col-span-2">
                      <h3 className="text-xl font-bold text-amber-900 mb-6 flex items-center gap-3">
                        <div className="p-2 bg-amber-100 rounded-lg text-amber-600">
                          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                        </div>
                        AEO Assignment Information
                      </h3>
                      <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                          <label className="text-xs font-bold text-amber-600/60 uppercase tracking-widest block ml-1">Assigned LGA</label>
                          <div className="bg-white/50 border border-amber-100 rounded-2xl px-5 py-4 text-sm font-bold text-amber-900">{userInfo.lga}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

function TabIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    user: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>,
    clock: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    shield: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>,
    lock: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
    cog: <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  };
  return icons[name] || null;
}

function InfoField({ label, value, icon }: { label: string; value: string; icon: string }) {
  const icons: Record<string, React.ReactNode> = {
    user: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
    mail: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    phone: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />,
    office: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />,
  };
  return (
    <div className="group/field">
      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 block">{label}</label>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-gray-50 text-gray-400 rounded-lg group-hover/field:bg-emerald-50 group-hover/field:text-emerald-600 transition-all">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[icon] || icons.user}</svg>
        </div>
        <p className="text-base font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

function StatCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: string }) {
  const colors: Record<string, string> = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    blue: "bg-blue-50 text-blue-600 border-blue-100",
    purple: "bg-purple-50 text-purple-600 border-purple-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100",
  };
  return (
    <div className={`p-6 rounded-3xl border shadow-sm hover:shadow-xl transition-all duration-500 bg-white group ${colors[color]}`}>
      <div className="flex flex-col gap-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${colors[color]} shadow-inner group-hover:scale-110 transition-transform`}>
          <StatIcon name={icon} />
        </div>
        <div>
          <p className="text-2xl font-black text-gray-900">{value}</p>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
      </div>
    </div>
  );
}

function StatIcon({ name }: { name: string }) {
  const icons: Record<string, React.ReactNode> = {
    document: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
    "credit-card": <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" />,
    chart: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v16m-6 0a2 2 0 002 2h2a2 2 0 002-2" />,
    lightning: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />,
  };
  return <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{icons[name] || icons.document}</svg>;
}

function HistoryItem({ date, device, status }: { date: string; device: string; status: string }) {
  return (
    <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl">
      <div className="flex items-center gap-4">
        <div className="h-10 w-10 bg-white text-gray-400 rounded-xl flex items-center justify-center shadow-sm">
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
        </div>
        <div>
          <p className="text-sm font-bold text-gray-900">{date}</p>
          <p className="text-xs text-gray-400">{device}</p>
        </div>
      </div>
      <span className="text-xs font-black text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg uppercase tracking-wider">{status}</span>
    </div>
  );
}

function ToggleField({ label, defaultChecked }: { label: string; defaultChecked?: boolean }) {
  return (
    <label className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl cursor-pointer group">
      <span className="text-sm font-bold text-gray-700 group-hover:text-gray-900">{label}</span>
      <div className="relative inline-flex items-center cursor-pointer">
        <input type="checkbox" defaultChecked={defaultChecked} className="sr-only peer" />
        <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
      </div>
    </label>
  );
}
