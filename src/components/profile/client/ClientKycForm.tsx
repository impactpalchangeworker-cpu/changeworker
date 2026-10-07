"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { db } from "@/lib/firebase"
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore"
import toast from "react-hot-toast"
import { motion } from "framer-motion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Button from "@/components/ui/Button"
import { BadgeCheck, ShieldAlert } from "lucide-react"

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  show: (i: number) => ({ opacity: 1, y: 0, transition: { delay: 0.05 * i } }),
}

export default function ClientKycForm() {
  const { user } = useAuth()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)

  const [cacNumber, setCacNumber] = useState("")
  const [repName, setRepName] = useState("")
  const [repRole, setRepRole] = useState("")
  const [repIdNumber, setRepIdNumber] = useState("")
  const [status, setStatus] = useState<string>("not_submitted")

  useEffect(() => {
    const run = async () => {
      if (!user?.uid) return
      setLoading(true)
      const snap = await getDoc(doc(db, "users", user.uid))
      const data = snap.data() as any
      const kyc = data?.orgKyc || {}

      setCacNumber(kyc?.cacNumber || "")
      setRepName(kyc?.repName || "")
      setRepRole(kyc?.repRole || "")
      setRepIdNumber(kyc?.repIdNumber || "")
      setStatus(kyc?.status || "not_submitted")
      setLoading(false)
    }
    run()
  }, [user?.uid])

  const save = async () => {
    if (!user?.uid) return
    if (!cacNumber.trim()) return toast.error("CAC number is required for verification")

    setSaving(true)
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          orgKyc: {
            cacNumber: cacNumber.trim(),
            repName: repName.trim(),
            repRole: repRole.trim(),
            repIdNumber: repIdNumber.trim(),
            status: "pending",
            updatedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      )
      toast.success("Verification submitted (pending review)")
      setStatus("pending")

      // notify admins
      try {
        const token = await user.getIdToken()
        if (token) {
          await fetch("/api/admin/kyc-submitted", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({ fullName: user.displayName || "", role: "client" }),
          })
        }
      } catch (err) {
        console.error("admin kyc notify failed", err)
      }
    } catch (e: any) {
      toast.error(e?.message || "Failed to submit verification")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-6 text-sm text-gray-600">
          Loading verification…
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div initial="hidden" animate="show">
      <motion.div variants={fadeUp} custom={0}>
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-base font-extrabold flex items-center gap-2">
              <BadgeCheck size={18} className="text-[var(--primary)]" />
              Organization verification
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-5">
            <div className="rounded-2xl border bg-orange-50 px-4 py-3 text-sm text-gray-700 flex items-start gap-3">
              <ShieldAlert className="text-[var(--primary)] mt-0.5" size={18} />
              <div>
                <div className="font-extrabold text-gray-900">
                  Verification is required
                </div>
                <div className="mt-1">
                  Organizations must verify before posting high-value gigs and funding projects.
                  Your organization profile is what talent will see.
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white px-4 py-3 text-sm">
              <span className="font-extrabold text-gray-900">Status:</span>{" "}
              <span className="font-semibold">
                {status === "pending"
                  ? "Pending"
                  : status === "verified"
                  ? "Verified"
                  : "Not submitted"}
              </span>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label>
                  CAC Registration Number <span className="text-red-600">*</span>
                </Label>
                <Input className="mt-2" value={cacNumber} onChange={(e) => setCacNumber(e.target.value)} />
              </div>
              <div>
                <Label>Authorized representative name</Label>
                <Input className="mt-2" value={repName} onChange={(e) => setRepName(e.target.value)} />
              </div>
              <div>
                <Label>Authorized representative role</Label>
                <Input className="mt-2" value={repRole} onChange={(e) => setRepRole(e.target.value)} />
              </div>
              <div>
                <Label>Representative ID number (optional)</Label>
                <Input className="mt-2" value={repIdNumber} onChange={(e) => setRepIdNumber(e.target.value)} />
              </div>
            </div>

            <Button onClick={save} disabled={saving}>
              {saving ? "Submitting..." : "Submit verification"}
            </Button>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}
