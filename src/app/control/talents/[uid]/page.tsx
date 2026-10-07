"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { db } from "@/lib/firebase"
import { doc, getDoc, updateDoc, deleteDoc, collection, getDocs, query, where } from "firebase/firestore"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Button from "@/components/ui/Button"
import { Badge } from "@/components/ui/badge"
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  Calendar,
  Award,
  Briefcase,
  GraduationCap,
  FileText,
  CheckCircle,
  X,
  Ban,
  Trash2,
  AlertTriangle,
  ShieldCheck,
  User,
  Mail,
  Phone,
} from "lucide-react"
import Link from "next/link"
import toast from "react-hot-toast"
import FancyLoader from "@/components/ui/FancyLoader"

type TalentProfile = {
  uid: string
  slug?: string
  fullName: string
  email?: string
  phone?: string
  location?: string
  bio?: string
  photoURL?: string
  roleTitle?: string
  hourlyRate?: number
  categories?: string[]
  sdgTags?: string[]
  skills?: string[]
  availability?: string
  workMode?: string
  yearsExperience?: number
  portfolio?: any[]
  education?: any[]
  certifications?: any[]
  employment?: any[]
  reviews?: any[]
  rating?: { avg?: number; count?: number }
  verification?: {
    status?: string
    submittedAt?: any
    documents?: any[]
    notes?: string
    nin?: string
  }
  impactPalBadge?: boolean
  disabled?: boolean
  createdAt?: any
}

export default function AdminTalentDetailPage() {
  const params = useParams()
  const uid = params.uid as string

  const [profile, setProfile] = useState<TalentProfile | null>(null)
  const [payoutAccount, setPayoutAccount] = useState<any>(null)
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
        const payoutSnap = await getDoc(doc(db, "payoutProfiles", resolvedUid))
        setPayoutAccount(payoutSnap.exists() ? payoutSnap.data()?.bank || null : null)

        if (profileSnap.exists()) {
          const profileData = profileSnap.data() as any
          const userData = userSnap.exists() ? (userSnap.data() as any) : {}
          const kycData = userData?.kyc || {}
          
          setProfile({
            uid: resolvedUid,
            slug: profileData.slug,
            fullName: profileData.fullName || "Unnamed Talent",
            email: profileData.email || userData?.email,
            phone: profileData.phone || userData?.phone,
            location: profileData.location,
            bio: profileData.bio,
            photoURL: profileData.publicProfile?.photoURL || profileData.photoURL,
            roleTitle: profileData.talent?.roleTitle,
            hourlyRate: profileData.publicProfile?.hourlyRate || profileData.hourlyRate,
            categories: profileData.publicProfile?.categories || profileData.categories || [],
            sdgTags: profileData.sdgTags || [],
            skills: profileData.talent?.skills || [],
            availability: profileData.talent?.availability,
            workMode: profileData.talent?.workMode,
            yearsExperience: profileData.talent?.yearsExperience,
            portfolio: profileData.portfolio || [],
            education: profileData.education || [],
            certifications: profileData.certifications || [],
            employment: profileData.employment || [],
            reviews: profileData.reviews || [],
            rating: profileData.rating || { avg: 0, count: 0 },
            verification: {
              status: kycData?.status || "not_submitted",
              submittedAt: kycData?.updatedAt,
              documents: [
                ...(kycData?.idUrl ? [{ type: `ID Document (${kycData?.idType || "Unknown"})`, url: kycData.idUrl }] : []),
                ...(kycData?.proofOfAddressUrl ? [{ type: "Proof of Address", url: kycData.proofOfAddressUrl }] : [])
              ],
              nin: kycData?.nin,
              notes: kycData?.adminNotes
            },
            impactPalBadge: Boolean(profileData?.impactPalBadge || userData?.impactPalBadge),
            disabled: profileData.disabled || false,
            createdAt: profileData.createdAt,
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
          await updateDoc(publicProfileRef, {
            "verification.status": "verified"
          })
          await updateDoc(userRef, {
            "kyc.status": "verified",
            "kyc.adminNotes": ""
          })
          toast.success("Talent verified successfully")
          setProfile(prev =>
            prev
              ? { ...prev, verification: { ...prev.verification, status: "verified", notes: "" } }
              : null
          )
          break
        }
        case "reject": {
          const reason = prompt("Enter reason for rejecting this verification:")
          if (reason === null) return

          await updateDoc(publicProfileRef, {
            "verification.status": "rejected"
          })
          await updateDoc(userRef, {
            "kyc.status": "rejected",
            "kyc.adminNotes": reason
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
          toast.success("Talent disabled")
          setProfile(prev => prev ? { ...prev, disabled: true } : null)
          break
        case "enable":
          await updateDoc(publicProfileRef, { disabled: false })
          toast.success("Talent enabled")
          setProfile(prev => prev ? { ...prev, disabled: false } : null)
          break
        case "toggleImpactpal": {
          const next = !Boolean(profile.impactPalBadge)
          await updateDoc(publicProfileRef, { impactPalBadge: next })
          await updateDoc(userRef, { impactPalBadge: next })
          toast.success(next ? "Impactpal badge added" : "Impactpal badge removed")
          setProfile((prev) => (prev ? { ...prev, impactPalBadge: next } : null))
          break
        }
        case "delete":
          if (confirm("Are you sure you want to permanently delete this talent account? This action cannot be undone.")) {
            await deleteDoc(publicProfileRef)
            await deleteDoc(userRef)
            toast.success("Talent deleted")
            window.location.href = "/control/talents"
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
      <FancyLoader label="Loading talent profile..." compact />
    )
  }

  if (!profile) {
    return (
        <div className="bg-[var(--secondary)] min-h-[calc(100vh-64px)] flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Profile Not Found</h2>
            <p className="text-gray-600 mb-4">The requested talent profile could not be found.</p>
            <Link href="/control/talents" className="text-[var(--primary)] hover:underline">
              ← Back to Talents
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
                  profile.fullName.slice(0, 1).toUpperCase()
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
                    {profile.impactPalBadge && (
                      <Badge className="border border-orange-200 bg-orange-50 text-[var(--primary)]">Impactpal</Badge>
                    )}
                  </div>
                </div>
                {profile.verification?.notes && (
                  <div className="mt-2 p-3 bg-red-50 rounded text-sm">
                    <strong>Admin note:</strong> {profile.verification.notes}
                  </div>
                )}

                <p className="text-gray-700 font-semibold mb-2">{profile.roleTitle || "Role title not set"}</p>

                <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                  {profile.location && (
                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      {profile.location}
                    </div>
                  )}
                  {profile.hourlyRate && (
                    <div className="flex items-center gap-1">
                      <DollarSign size={14} />
                      ₦{Number(profile.hourlyRate).toLocaleString()}/hr
                    </div>
                  )}
                  {profile.yearsExperience && (
                    <div className="flex items-center gap-1">
                      <Briefcase size={14} />
                      {profile.yearsExperience} years exp
                    </div>
                  )}
                  {profile.rating?.count && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-yellow-500 fill-current" />
                      {profile.rating.avg?.toFixed(1)} ({profile.rating.count} reviews)
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {profile.skills?.slice(0, 5).map((skill) => (
                    <Badge key={skill} variant="outline" className="text-xs">
                      {skill}
                    </Badge>
                  ))}
                  {profile.skills && profile.skills.length > 5 && (
                    <Badge variant="outline" className="text-xs">
                      +{profile.skills.length - 5} more
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
                href={`/control/talents/${profile.uid}/proposals`}
                className="inline-flex items-center gap-2 rounded-full border bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:border-orange-200 hover:bg-orange-50 hover:text-[var(--primary)]"
              >
                <FileText size={14} />
                Proposals
              </Link>
              <Link
                href={`/control/talents/${profile.uid}/workspaces`}
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
                    className="bg-green-600 hover:bg-green-700 text-white w-full text-sm py-2 px-3"
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Verify Talent
                  </Button>
                )}

                {profile.verification?.status === "pending" && (
                  <Button
                    onClick={() => handleAction("reject")}
                    variant="outline"
                    className="border-red-500 text-red-600 hover:bg-red-50 w-full text-sm py-2 px-3"
                  >
                    <X size={14} className="mr-2" />
                    Reject Verification
                  </Button>
                )}

                {!profile.disabled ? (
                  <Button
                    onClick={() => handleAction("disable")}
                    variant="outline"
                    className="border-yellow-500 text-yellow-700 hover:bg-yellow-50 w-full text-sm py-2 px-3"
                  >
                    <Ban size={14} className="mr-2" />
                    Disable Account
                  </Button>
                ) : (
                  <Button
                    onClick={() => handleAction("enable")}
                    className="bg-blue-600 hover:bg-blue-700 text-white w-full text-sm py-2 px-3"
                  >
                    <CheckCircle size={14} className="mr-2" />
                    Enable Account
                  </Button>
                )}

                <Button
                  onClick={() => handleAction("toggleImpactpal")}
                  variant="outline"
                  className="border-orange-300 text-orange-700 hover:bg-orange-50 w-full text-sm py-2 px-3"
                >
                  {profile.impactPalBadge ? "Remove Impactpal Badge" : "Add Impactpal Badge"}
                </Button>

                <Button
                  onClick={() => handleAction("delete")}
                  className="bg-red-600 hover:bg-red-700 text-white w-full text-sm py-2 px-3"
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
              {/* Keep the main column informative for newly created or partially completed profiles. */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold">Professional overview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
                    {profile.bio || "This talent has not added a professional summary yet. Their available marketplace information is shown below as the profile is completed."}
                  </p>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <div className="border rounded-lg p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Role</p><p className="mt-1 font-semibold text-gray-800">{profile.roleTitle || "Not provided"}</p></div>
                    <div className="border rounded-lg p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Availability</p><p className="mt-1 font-semibold text-gray-800">{profile.availability || "Not provided"}</p></div>
                    <div className="border rounded-lg p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Work preference</p><p className="mt-1 font-semibold text-gray-800">{profile.workMode || "Not provided"}</p></div>
                    <div className="border rounded-lg p-4"><p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Experience</p><p className="mt-1 font-semibold text-gray-800">{profile.yearsExperience ? `${profile.yearsExperience} years` : "Not provided"}</p></div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.skills?.length ? profile.skills.map((skill) => <Badge key={skill} variant="outline" className="max-w-full whitespace-normal text-xs">{skill}</Badge>) : <p className="text-sm text-gray-500">No skills added yet.</p>}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Impact focus</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.sdgTags?.length ? profile.sdgTags.map((sdg) => <Badge key={sdg} variant="secondary" className="max-w-full whitespace-normal text-xs">{sdg}</Badge>) : <p className="text-sm text-gray-500">No SDG focus areas selected yet.</p>}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-lg font-extrabold">Payment arrangement</CardTitle></CardHeader>
                <CardContent className="text-sm text-gray-700">
                  {payoutAccount ? <><p className="font-semibold text-emerald-700">Verified direct-payment account</p><p className="mt-2">{payoutAccount.accountName} · {payoutAccount.accountNumber} · {payoutAccount.bankName}</p></> : <p>No verified payout account. The talent must verify a bank account before approved project payments can be sent.</p>}
                  <p className="mt-3 text-xs text-gray-500">Talent payments are sent directly after final delivery approval. Platform fee: 10%.</p>
                </CardContent>
              </Card>

              <Card className="rounded-2xl">
                <CardHeader><CardTitle className="text-lg font-extrabold">Marketplace records</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <Link href={`/control/talents/${profile.uid}/proposals`} className="border rounded-lg p-4 transition hover:border-orange-200 hover:bg-orange-50"><FileText size={18} className="mb-2 text-[var(--primary)]" /><p className="font-semibold text-gray-800">Proposals</p><p className="text-sm text-gray-500">Review submitted proposals</p></Link>
                  <Link href={`/control/talents/${profile.uid}/workspaces`} className="border rounded-lg p-4 transition hover:border-orange-200 hover:bg-orange-50"><Briefcase size={18} className="mb-2 text-[var(--primary)]" /><p className="font-semibold text-gray-800">Workspaces</p><p className="text-sm text-gray-500">Review active engagements</p></Link>
                </CardContent>
              </Card>

              {/* PORTFOLIO */}
              {profile.portfolio && profile.portfolio.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <FileText size={18} />
                      Portfolio
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.portfolio.map((item: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold mb-2">{item.title}</h4>
                          <p className="text-sm text-gray-600 mb-2">{item.description}</p>
                          {item.url && (
                            <a href={item.url} target="_blank" rel="noopener noreferrer"
                               className="text-[var(--primary)] hover:underline text-sm">
                              View Project →
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* EMPLOYMENT HISTORY */}
              {profile.employment && profile.employment.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <Briefcase size={18} />
                      Employment History
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.employment.map((job: any, index: number) => (
                        <div key={index} className="border-l-2 border-[var(--primary)] pl-4">
                          <h4 className="font-semibold">{job.position}</h4>
                          <p className="text-[var(--primary)] font-medium">{job.company}</p>
                          <p className="text-sm text-gray-600">
                            {job.startDate} - {job.endDate || "Present"}
                          </p>
                          {job.description && (
                            <p className="text-sm text-gray-700 mt-2">{job.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* EDUCATION */}
              {profile.education && profile.education.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <GraduationCap size={18} />
                      Education
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.education.map((edu: any, index: number) => (
                        <div key={index} className="border-l-2 border-[var(--primary)] pl-4">
                          <h4 className="font-semibold">{edu.degree}</h4>
                          <p className="text-[var(--primary)] font-medium">{edu.institution}</p>
                          <p className="text-sm text-gray-600">
                            {edu.startDate} - {edu.endDate || "Present"}
                          </p>
                          {edu.description && (
                            <p className="text-sm text-gray-700 mt-2">{edu.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* CERTIFICATIONS */}
              {profile.certifications && profile.certifications.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <Award size={18} />
                      Certifications
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {profile.certifications.map((cert: any, index: number) => (
                        <div key={index} className="border rounded-lg p-4">
                          <h4 className="font-semibold">{cert.name}</h4>
                          <p className="text-[var(--primary)] text-sm">{cert.issuer}</p>
                          <p className="text-sm text-gray-600">
                            Issued: {cert.issueDate}
                            {cert.expiryDate && ` • Expires: ${cert.expiryDate}`}
                          </p>
                          {cert.credentialId && (
                            <p className="text-xs text-gray-500 mt-1">ID: {cert.credentialId}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* REVIEWS */}
              {profile.reviews && profile.reviews.length > 0 && (
                <Card className="rounded-2xl">
                  <CardHeader>
                    <CardTitle className="text-lg font-extrabold flex items-center gap-2">
                      <Star size={18} />
                      Reviews ({profile.reviews.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {profile.reviews.slice(0, 5).map((review: any, index: number) => (
                        <div key={index} className="border-b pb-4 last:border-b-0">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="flex">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  size={14}
                                  className={i < (review.rating || 0) ? "text-yellow-500 fill-current" : "text-gray-300"}
                                />
                              ))}
                            </div>
                            <span className="text-sm font-medium">{review.clientName || "Anonymous"}</span>
                            <span className="text-xs text-gray-500">
                              {review.createdAt?.toDate?.()?.toLocaleDateString() || "Recent"}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700">{review.comment}</p>
                        </div>
                      ))}
                    </div>
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

                    {profile.verification.nin && (
                      <div>
                        <div className="text-sm font-medium mb-1">NIN</div>
                        <div className="text-sm text-gray-600">{profile.verification.nin}</div>
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

                    {profile.verification.notes && (
                      <div>
                        <div className="text-sm font-medium mb-1">Notes</div>
                        <div className="text-sm text-gray-600">{profile.verification.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* WORK PREFERENCES */}
              <Card className="rounded-2xl">
                <CardHeader>
                  <CardTitle className="text-lg font-extrabold">Work Preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {profile.availability && (
                    <div>
                      <div className="text-sm font-medium mb-1">Availability</div>
                      <div className="text-sm text-gray-600">{profile.availability}</div>
                    </div>
                  )}

                  {profile.workMode && (
                    <div>
                      <div className="text-sm font-medium mb-1">Work Mode</div>
                      <div className="text-sm text-gray-600">{profile.workMode}</div>
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
