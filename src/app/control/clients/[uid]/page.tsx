"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Button from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import FancyLoader from "@/components/ui/FancyLoader"
import {
  MapPin,
  Star,
  Calendar,
  CheckCircle,
  X,
  Ban,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import { pickClientCategories, pickClientPhoto } from "@/lib/publicClients"

type ClientProfile = {
  uid: string
  slug?: string
  fullName: string
  email?: string
  phone?: string
  location?: string
  bio?: string
  photoURL?: string
  companyName?: string
  industry?: string
  categories?: string[]
  sdgTags?: string[]
  website?: string
  rating?: { avg?: number; count?: number }
  verification?: {
    status?: string
    submittedAt?: any
    documents?: any[]
    notes?: string
    mode?: "org" | "contact"
    cacNumber?: string
    repName?: string
    repRole?: string
    contactName?: string
    contactNin?: string
  }
  disabled?: boolean
  createdAt?: any
  openGigsCount?: number
}

export default function AdminClientDetailPage() {
  const params = useParams()
  const uid = params.uid as string

  const [profile, setProfile] = useState<ClientProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true)
      try {
        let resolvedUid = uid
        let profileRef = doc(db, "publicProfiles", resolvedUid)
        let profileSnap = await getDoc(profileRef)
        if (!profileSnap.exists()) {
          const slugSnap = await getDocs(query(collection(db, "publicProfiles"), where("slug", "==", uid)))
          if (!slugSnap.empty) {
            resolvedUid = slugSnap.docs[0].id
            profileRef = doc(db, "publicProfiles", resolvedUid)
            profileSnap = await getDoc(profileRef)
          }
        }
        const userRef = doc(db, "users", resolvedUid)
        const userSnap = await getDoc(userRef)

        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as any
          const userData = userSnap.exists() ? (userSnap.data() as any) : {}
          const orgKycData = userData?.orgKyc || {}

          // Get open gigs count
          const gigsSnap = await getDocs(
            query(collection(db, "gigs"), where("clientUid", "==", resolvedUid), where("status", "==", "open"))
          )
          const openGigsCount = gigsSnap.size

          const orgName = profileData.client?.orgName || profileData.clientOrgName || profileData.fullName || "Unnamed Organization"
          const photoURL = pickClientPhoto(profileData)
          const categories = pickClientCategories(profileData)

          setProfile({
            uid: resolvedUid,
            slug: profileData.slug,
            fullName: orgName,
            email: profileData.email || userData?.email,
            phone: profileData.phone || userData?.phone,
            location: profileData.location,
            bio: profileData.bio || profileData.client?.bio,
            photoURL,
            companyName: profileData.client?.companyName || profileData.companyName,
            industry: profileData.client?.industry,
            categories,
            sdgTags: profileData.sdgTags || [],
            website: profileData.client?.website || profileData.website,
            rating: profileData.rating || { avg: 0, count: 0 },
            verification: {
              status: orgKycData?.status || "not_submitted",
              submittedAt: orgKycData?.updatedAt,
              documents: [
                ...(orgKycData?.cacDocUrl ? [{ type: "CAC Document", url: orgKycData.cacDocUrl }] : []),
                ...(orgKycData?.contactIdUrl ? [{ type: "Contact ID Document", url: orgKycData.contactIdUrl }] : [])
              ],
              cacNumber: orgKycData?.cacNumber,
              repName: orgKycData?.repName,
              repRole: orgKycData?.repRole,
              contactName: orgKycData?.contactName,
              contactNin: orgKycData?.contactNin,
              mode: orgKycData?.mode || "org",
              notes: orgKycData?.adminNotes
            },
            disabled: profileData.disabled || false,
            createdAt: profileData.createdAt,
            openGigsCount,
          })
        }
      } catch (error) {
        console.error("Error fetching profile:", error)
        toast.error("Failed to load profile")
      } finally {
        setLoading(false)
      }
    }

    if (uid) fetchProfile()
  }, [uid])

  const handleAction = async (action: string) => {
    if (!profile) return

    try {
      const publicProfileRef = doc(db, "publicProfiles", profile.uid)
      const userRef = doc(db, "users", profile.uid)

      switch (action) {
        case "verify": {
          // sync both public profile and underlying user document
          await updateDoc(publicProfileRef, {
            "verification.status": "verified"
          })
          await updateDoc(userRef, {
            "orgKyc.status": "verified",
            "orgKyc.adminNotes": ""
          })
          toast.success("Client verified successfully")
          setProfile(prev =>
            prev
              ? { ...prev, verification: { ...prev.verification, status: "verified", notes: "" } }
              : null
          )
          break
        }
        case "reject": {
          // ask for a reason before rejecting
          const reason = prompt("Enter reason for rejecting this verification:")
          if (reason === null) return // cancelled

          await updateDoc(publicProfileRef, {
            "verification.status": "rejected"
          })
          await updateDoc(userRef, {
            "orgKyc.status": "rejected",
            "orgKyc.adminNotes": reason
          })
          toast.success("Verification rejected")
          setProfile(prev =>
            prev
              ? { ...prev, verification: { ...prev.verification, status: "rejected", notes: reason } }
              : null
          )
          break
        }
        case "disable":
          await updateDoc(publicProfileRef, { disabled: true })
          toast.success("Client disabled")
          setProfile(prev => prev ? { ...prev, disabled: true } : null)
          break
        case "enable":
          await updateDoc(publicProfileRef, { disabled: false })
          toast.success("Client enabled")
          setProfile(prev => prev ? { ...prev, disabled: false } : null)
          break
        case "delete":
          if (confirm("Are you sure you want to permanently delete this client account? This action cannot be undone.")) {
            await deleteDoc(publicProfileRef)
            await deleteDoc(userRef)
            toast.success("Client deleted")
            window.location.href = "/control/clients"
          }
          break
      }
    } catch (error) {
      toast.error("Action failed")
      console.error(error)
    }
  }

  if (loading) {
    return (
        <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--primary)] mx-auto mb-4"></div>
            <FancyLoader label="Loading client profile..." compact />
          </div>
        </div>
    )
  }

  if (!profile) {
    return (
        <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">The requested client profile could not be found.</p>
            <Link href="/control/clients" className="text-[var(--primary)] hover:underline">
              ← Back to Clients
            </Link>
          </div>
        </div>
    )
  }

  return (

      <div className="control-profile-page">
        <div className="control-profile-inner">
          {/* HEADER */}
          <div className="control-profile-hero flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6 mb-6">
            <div className="flex items-start gap-4">
              <div className="control-profile-avatar h-20 w-20 rounded-full bg-orange-50 flex items-center justify-center font-extrabold text-2xl text-[var(--primary)] overflow-hidden">
                {profile.photoURL ? (
                  <img src={profile.photoURL} alt={profile.fullName} className="h-full w-full object-cover" />
                ) : (
                  <Building size={32} className="text-[var(--primary)]" />
                )}
              </div>

              <div className="flex-1">
                <div className="flex items-center gap-3 flex-wrap mb-2">
                  <h1 className="text-2xl lg:text-3xl font-extrabold">{profile.fullName}</h1>
                  <div className="flex gap-2">
                    <Badge variant={profile.verification?.status === "verified" ? "default" : "secondary"}>
                      {profile.verification?.status === "verified" ? "Verified" :
                       profile.verification?.status === "pending" ? "Pending Verification" :
                       profile.verification?.status === "rejected" ? "Rejected" : "Not Submitted"}
                    </Badge>
                    {profile.disabled && (
                      <Badge variant="destructive">Disabled</Badge>
                    )}
                  </div>
                </div>
                {profile.verification?.notes && (
                  <div className="mt-2 p-3 bg-red-50 rounded text-sm">
                    <strong>Admin note:</strong> {profile.verification.notes}
                  </div>
                )}
                <p className="text-gray-700 font-semibold mb-2">{profile.companyName || "Company not specified"}</p>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {profile.location}
                    </div>
                  )}
                  {profile.industry && (
                    <div className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {profile.industry}
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <Briefcase size={14} />
                    {profile.openGigsCount || 0} open gigs
                  </div>
                  {profile.rating?.count && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      {profile.rating.avg?.toFixed(1)} ({profile.rating.count} reviews)
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.categories?.slice(0, 5).map((category) => (
                    <Badge key={category} variant="outline" className="text-xs">
                      {category}
                    </Badge>
                  ))}
                  {profile.categories && profile.categories.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.categories.length - 5} more
                    </Badge>
                  )}
                </div>

                <div className="flex flex-wrap gap-1">
                  {profile.sdgTags?.slice(0, 3).map((sdg) => (
                    <Badge key={sdg} variant="secondary" className="text-xs">
                      {sdg}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* related data tabs */}
            <div className="mt-6 flex flex-wrap gap-3">
              <Link
                href={`/control/clients/${profile.uid}/gigs`}
                className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
              >
                <Briefcase size={14} />
                Gigs
              </Link>
              <Link
                href={`/control/clients/${profile.uid}/proposals`}
                className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
              >
                <Building size={14} />
                Proposals
              </Link>
              <Link
                href={`/control/clients/${profile.uid}/workspaces`}
                className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
              >
                <Briefcase size={14} />
                Workspaces
              </Link>
            </div>

            {/* ADMIN ACTIONS */}
            <div className="control-profile-actions flex flex-col gap-2 min-w-[200px]">
              <div className="flex flex-col gap-1">
                {profile.verification?.status !== "verified" && (
                  <Button
                    onClick={() => handleAction("verify")}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Verify Client
                  </Button>
                )}

                {profile.verification?.status === "pending" && (
                  <Button
                    onClick={() => handleAction("reject")}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50"
                  >
                    <X size={14} className="mr-2" />
                    Reject Verification
                  </Button>
                )}

                {!profile.disabled ? (
                  <Button
                    onClick={() => handleAction("disable")}
                    variant="outline"
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-50"
                  >
                    <Ban size={14} className="mr-2" />
                    Disable Account
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAction("enable")}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Enable Account
                  </Button>
                )}

                <Button
                  onClick={() => handleAction("delete")}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 size={14} className="mr-2" />
                  Delete Account
                </Button>
              </div>
            </div>
          </div>

          {/* CONTENT GRID */}
          <div className="control-profile-content grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* MAIN CONTENT */}
            <div className="lg:col-span-2 space-y-6">
              {/* This remains useful even when an organization has not completed optional fields. */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold">Organization overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {profile.bio || "This organization has not added an overview yet. Its marketplace information and activity are shown below as the profile is completed."}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="border rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Organization</p>
                      <p className="mt-1 font-semibold text-gray-800">{profile.companyName || "Not provided"}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Industry</p>
                      <p className="mt-1 font-semibold text-gray-800">{profile.industry || "Not provided"}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Location</p>
                      <p className="mt-1 font-semibold text-gray-800">{profile.location || "Not provided"}</p>
                    </div>
                    <div className="border rounded-lg p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Marketplace activity</p>
                      <p className="mt-1 font-semibold text-gray-800">{profile.openGigsCount || 0} open gigs</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Work categories</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.categories?.length ? profile.categories.map((category) => (
                        <Badge key={category} variant="outline" className="max-w-full whitespace-normal text-xs">{category}</Badge>
                      )) : <p className="text-sm text-gray-500">No work categories selected yet.</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Impact focus</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.sdgTags?.length ? profile.sdgTags.map((sdg) => (
                        <Badge key={sdg} variant="secondary" className="max-w-full whitespace-normal text-xs">{sdg}</Badge>
                      )) : <p className="text-sm text-gray-500">No SDG focus areas selected yet.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-lg font-extrabold">Project payments</CardTitle></CardHeader>
                <CardContent className="text-sm text-gray-700">
                  <p>Client payments are made directly from each workspace after the agreement is ready. There is no stored platform balance for this account.</p>
                  <p className="mt-3 text-xs text-gray-500">Final delivery approval starts the talent payment process. The standard platform fee is 10% of the agreed project amount.</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold">Marketplace records</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Link href={`/control/clients/${profile.uid}/gigs`} className="border rounded-lg p-4 transition hover:border-orange-200 hover:bg-orange-50">
                    <Briefcase size={18} className="mb-2 text-[var(--primary)]" />
                    <p className="font-semibold text-gray-800">Gigs</p>
                    <p className="text-sm text-gray-500">View posted opportunities</p>
                  </Link>
                  <Link href={`/control/clients/${profile.uid}/proposals`} className="border rounded-lg p-4 transition hover:border-orange-200 hover:bg-orange-50">
                    <Building size={18} className="mb-2 text-[var(--primary)]" />
                    <p className="font-semibold text-gray-800">Proposals</p>
                    <p className="text-sm text-gray-500">Review talent responses</p>
                  </Link>
                  <Link href={`/control/clients/${profile.uid}/workspaces`} className="border rounded-lg p-4 transition hover:border-orange-200 hover:bg-orange-50">
                    <CheckCircle size={18} className="mb-2 text-[var(--primary)]" />
                    <p className="font-semibold text-gray-800">Workspaces</p>
                    <p className="text-sm text-gray-500">Review active engagements</p>
                  </Link>
                </CardContent>
              </Card>

              {/* WEBSITE */}
              {profile.website && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-extrabold">Website</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <a
                      href={profile.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--primary)] hover:underline"
                    >
                      {profile.website}
                    </a>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* SIDEBAR */}
            <div className="space-y-6">
              {/* CONTACT INFO */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                    <User size={18} />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.email && (
                    <div className="flex items-center gap-2">
                      <Mail size={14} className="text-gray-500" />
                      <span className="text-sm">{profile.email}</span>
                    </div>
                  )}
                  {profile.phone && (
                    <div className="flex items-center gap-2">
                      <Phone size={14} className="text-gray-500" />
                      <span className="text-sm">{profile.phone}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Calendar size={14} className="text-gray-500" />
                    <span className="text-sm">
                      Joined {profile.createdAt?.toDate?.()?.toLocaleDateString() || "Recently"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* VERIFICATION DETAILS */}
              {profile.verification && profile.verification.status !== "not_submitted" && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <ShieldCheck size={18} />
                      Verification Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <div className="text-sm font-medium mb-1">Status</div>
                      <Badge variant={profile.verification.status === "verified" ? "default" : "secondary"}>
                        {profile.verification.status}
                      </Badge>
                    </div>

                    {profile.verification.submittedAt && (
                      <div>
                        <div className="text-sm font-medium mb-1">Submitted</div>
                        <div className="text-sm text-gray-600">
                          {profile.verification.submittedAt?.toDate?.()?.toLocaleDateString()}
                        </div>
                      </div>
                    )}

                    {profile.verification.documents && profile.verification.documents.length > 0 && (
                      <div>
                        <div className="text-sm font-medium mb-2">Submitted Documents</div>
                        <div className="space-y-1">
                          {profile.verification.documents.map((doc: any, index: number) => (
                            <div key={index} className="text-sm text-gray-600 flex items-center gap-2">
                              <span>• {doc.type || "Document"}</span>
                              {doc.url && (
                                <a href={doc.url} target="_blank" rel="noopener noreferrer" className="text-[var(--primary)] hover:underline text-xs">
                                  View
                                </a>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {profile.verification.mode === "org" && (
                      <>
                        {profile.verification.cacNumber && (
                          <div>
                            <div className="text-sm font-medium mb-1">CAC Number</div>
                            <div className="text-sm text-gray-600">{profile.verification.cacNumber}</div>
                          </div>
                        )}

                        {profile.verification.repName && (
                          <div>
                            <div className="text-sm font-medium mb-1">Representative Name</div>
                            <div className="text-sm text-gray-600">{profile.verification.repName}</div>
                          </div>
                        )}

                        {profile.verification.repRole && (
                          <div>
                            <div className="text-sm font-medium mb-1">Representative Role</div>
                            <div className="text-sm text-gray-600">{profile.verification.repRole}</div>
                          </div>
                        )}
                      </>
                    )}

                    {profile.verification.mode === "contact" && (
                      <>
                        {profile.verification.contactName && (
                          <div>
                            <div className="text-sm font-medium mb-1">Contact Name</div>
                            <div className="text-sm text-gray-600">{profile.verification.contactName}</div>
                          </div>
                        )}
                        {profile.verification.contactNin && (
                          <div>
                            <div className="text-sm font-medium mb-1">Contact NIN</div>
                            <div className="text-sm text-gray-600">{profile.verification.contactNin}</div>
                          </div>
                        )}
                      </>
                    )}

                    {profile.verification.notes && (
                      <div>
                        <div className="text-sm font-medium mb-1">Notes</div>
                        <div className="text-sm text-gray-600">{profile.verification.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* BUSINESS INFO */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold">Business Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.companyName && (
                    <div>
                      <div className="text-sm font-medium mb-1">Company Name</div>
                      <div className="text-sm text-gray-600">{profile.companyName}</div>
                    </div>
                  )}

                  {profile.industry && (
                    <div>
                      <div className="text-sm font-medium mb-1">Industry</div>
                      <div className="text-sm text-gray-600">{profile.industry}</div>
                    </div>
                  )}

                  {profile.categories && profile.categories.length > 0 && (
                    <div>
                      <div className="text-sm font-medium mb-2">Categories</div>
                      <div className="flex flex-wrap gap-1">
                        {profile.categories.map((cat) => (
                          <Badge key={cat} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
  )
}
