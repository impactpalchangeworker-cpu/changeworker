"use client"

import { useEffect, useState } from "react"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/context/AuthContext"

type Role = "talent" | "client" | null

export function useUserRole() {
  const { user } = useAuth()
  const [role, setRole] = useState<Role>(null)
  const [loadingRole, setLoadingRole] = useState(true)

  useEffect(() => {
    let alive = true

    const run = async () => {
      if (!user?.uid) {
        if (!alive) return
        setRole(null)
        setLoadingRole(false)
        return
      }

      try {
        setLoadingRole(true)

        // Cache roles per account so switching users in the same browser cannot leak a role.
        const cacheKey = `sm_role_${user.uid}`
        const cached = window.localStorage.getItem(cacheKey)
        if (cached === "talent" || cached === "client") {
          setRole(cached)
          setLoadingRole(false)
          return
        }

        const snap = await getDoc(doc(db, "users", user.uid))
        const r = (snap.exists() ? snap.data()?.role : null) as Role

        if (!alive) return
        if (r === "talent" || r === "client") {
          setRole(r)
          window.localStorage.setItem(cacheKey, r)
        } else {
          setRole(null)
        }
      } catch {
        if (!alive) return
        setRole(null)
      } finally {
        if (!alive) return
        setLoadingRole(false)
      }
    }

    run()
    return () => {
      alive = false
    }
  }, [user?.uid])

  return { role, loadingRole }
}
