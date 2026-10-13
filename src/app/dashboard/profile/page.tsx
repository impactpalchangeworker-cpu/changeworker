"use client"

export const dynamic = "force-dynamic"

import RequireAuth from "@/components/auth/RequireAuth"
import AuthNavbar from "@/components/layout/AuthNavbar"
import { useUserRole } from "@/hooks/useUserRole"
import TalentProfilePage from "@/components/profile/TalentProfilePage"
import ClientProfilePage from "@/components/profile/ClientProfilePage"
import PushNotificationsToggle from "@/components/profile/PushNotificationsToggle"

export default function ProfilePage() {
  const { role, loadingRole } = useUserRole()

  return (
    <RequireAuth>
      <div className="dashboard-page min-h-[calc(100vh-64px)] bg-[var(--secondary)]">
        <AuthNavbar />
        <div className="dashboard-page-shell">
          <div className="mx-auto mb-4 max-w-6xl px-4"><PushNotificationsToggle /></div>
          {loadingRole ? (
            <div className="flex min-h-[calc(100vh-132px)] items-center justify-center">
              <div className="rounded-full border bg-white px-5 py-3 text-sm text-gray-600 shadow-sm">
                Loading profile...
              </div>
            </div>
          ) : role === "client" ? (
            <ClientProfilePage />
          ) : (
            <TalentProfilePage />
          )}
        </div>
      </div>
    </RequireAuth>
  )
}
