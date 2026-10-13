jest.mock("@/lib/firebaseAdmin", () => ({
  getAdminAuth: jest.fn(),
  getAdminApp: jest.fn(),
  getAdminDb: jest.fn(),
}))

jest.mock("@/lib/notifications/sendPlatformNotification", () => ({
  notifyUser: jest.fn(),
}))

jest.mock("@/lib/notifications/notifyAdmins", () => ({
  notifyAdmins: jest.fn(),
}))

jest.mock("firebase-admin/firestore", () => ({
  FieldValue: {
    serverTimestamp: jest.fn(() => "SERVER_TIMESTAMP"),
  },
  getFirestore: jest.fn(),
}))

function makeMockResponse(body: any, init?: { status?: number }) {
  return {
  status: init?.status || 200,
  ok: (init?.status || 200) < 400,
  json: async () => body,
  }
}

;(global as any).Response = {
  json: makeMockResponse,
}

jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: any, init?: { status?: number }) => ({
      status: init?.status || 200,
      ok: (init?.status || 200) < 400,
      json: async () => body,
    }),
  },
}))

import { POST as sendMessage } from "@/app/api/messages/send/route"
import { POST as submitReview } from "@/app/api/reviews/route"
import { POST as submitPlatformReview } from "@/app/api/reviews/platform/route"
import { POST as createDispute } from "@/app/api/disputes/create/route"
import { POST as submitMilestone } from "@/app/api/workspaces/submit-milestone/route"
import { POST as reviewMilestone } from "@/app/api/workspaces/review-milestone/route"
import { POST as submitFinalWork } from "@/app/api/workspaces/submit-final-work/route"
import { POST as reviewFinalWork } from "@/app/api/workspaces/review-final-work/route"
import { POST as notifyNewGig } from "@/app/api/admin/new-gig/route"
import { getAdminApp, getAdminAuth, getAdminDb } from "@/lib/firebaseAdmin"
import { notifyUser } from "@/lib/notifications/sendPlatformNotification"
import { notifyAdmins } from "@/lib/notifications/notifyAdmins"

const mockedGetAdminAuth = getAdminAuth as jest.Mock
const mockedGetAdminApp = getAdminApp as jest.Mock
const mockedGetAdminDb = getAdminDb as jest.Mock
const mockedNotifyUser = notifyUser as jest.Mock
const mockedNotifyAdmins = notifyAdmins as jest.Mock

function jsonRequest(body: any, token = "valid-token") {
  return {
    headers: {
      get: (name: string) => {
        const normalized = name.toLowerCase()
        if (normalized === "authorization") return `Bearer ${token}`
        if (normalized === "content-type") return "application/json"
        return null
      },
    },
    json: async () => body,
  } as unknown as Request
}

function makeDocRef({
  data,
  exists = true,
  id = "doc-1",
  subcollections = {},
}: {
  data?: any
  exists?: boolean
  id?: string
  subcollections?: Record<string, any>
} = {}) {
  const docRef: any = {
    id,
    get: jest.fn().mockResolvedValue({
      exists,
      data: () => data,
    }),
    update: jest.fn(async (patch: any) => {
      if (data && typeof data === "object") Object.assign(data, patch)
    }),
    set: jest.fn().mockResolvedValue(undefined),
    collection: jest.fn((name: string) => subcollections[name]),
  }

  return docRef
}

function makeCollectionRef(config: {
  addId?: string
  docs?: any[]
  empty?: boolean
  docRef?: any
}) {
  return {
    add: jest.fn(async () => ({ id: config.addId || "generated-id" })),
    doc: jest.fn(() => config.docRef || makeDocRef()),
    where: jest.fn().mockReturnThis(),
    get: jest.fn().mockResolvedValue({
      empty: config.empty ?? !(config.docs && config.docs.length),
      docs: config.docs || [],
    }),
  }
}

describe("Real non-admin flow routes", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockedGetAdminAuth.mockReturnValue({
      verifyIdToken: jest.fn(async () => ({ uid: "user-1" })),
    })
    mockedGetAdminApp.mockReturnValue({
      auth: () => ({
        verifyIdToken: jest.fn(async () => ({ uid: "user-1" })),
      }),
    })
  })

  describe("messages", () => {
    it("rejects missing auth and sends a real thread message with attachment metadata when authorized", async () => {
      const unauthorized = await sendMessage(
        {
          headers: { get: () => null },
          json: async () => ({}),
        } as any
      )
      expect(unauthorized.status).toBe(401)

      const messagesCollection = makeCollectionRef({ addId: "msg-123" })
      const threadRef = makeDocRef({
        data: {
          participants: ["user-1", "user-2"],
          gigTitle: "Landing page redesign",
          clientUid: "user-1",
          clientName: "Acme",
          talentName: "Ada",
        },
        subcollections: {
          messages: messagesCollection,
        },
      })

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn(() => ({
          doc: jest.fn(() => threadRef),
        })),
      })

      const response = await sendMessage(
        jsonRequest({
          threadId: "thread-1",
          text: "",
          meta: { source: "chat" },
          attachments: [
            {
              name: "brief.pdf",
              url: "https://files.example/brief.pdf",
              storagePath: "threads/thread-1/attachments/brief.pdf",
              contentType: "application/pdf",
              size: 12345,
            },
          ],
        }) as any
      )

      expect(response.status).toBe(200)
      expect(messagesCollection.add).toHaveBeenCalledWith(
        expect.objectContaining({
          fromUid: "user-1",
          text: "",
          meta: { source: "chat" },
          attachments: [
            expect.objectContaining({
              name: "brief.pdf",
              storagePath: "threads/thread-1/attachments/brief.pdf",
            }),
          ],
        })
      )
      expect(threadRef.update).toHaveBeenCalledWith(
        expect.objectContaining({
          lastMessageText: "Sent 1 attachment",
          lastMessageBy: "user-1",
        })
      )
      expect(mockedNotifyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-2",
          type: "message",
        })
      )
    })
  })

  describe("peer reviews", () => {
    it("prevents duplicate reviews and stores approved completed-workspace reviews", async () => {
      const duplicateReviewsCollection = makeCollectionRef({
        empty: false,
        docs: [{ data: () => ({ id: "existing-review" }) }],
      })
      const workspacesCollection = {
        doc: jest.fn(() =>
          makeDocRef({
            data: {
              status: "completed",
              clientUid: "user-1",
              talentUid: "user-2",
            },
            subcollections: {
              finalWork: {
                doc: jest.fn(() =>
                  makeDocRef({
                    data: { status: "approved" },
                  })
                ),
              },
            },
          })
        ),
      }

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn((name: string) => {
          if (name === "workspaces") return workspacesCollection
          if (name === "reviews") return duplicateReviewsCollection
          throw new Error(`Unexpected collection ${name}`)
        }),
      })

      const duplicateResponse = await submitReview(
        jsonRequest({
          workspaceId: "ws-1",
          rating: 5,
          title: "Great work",
          publicComment: "Excellent",
          isPublic: true,
          fromRole: "client",
        })
      )
      expect(duplicateResponse.status).toBe(400)

      const addReview = jest.fn(async () => ({ id: "review-123" }))
      const publicReviewDocs = [
        { data: () => ({ rating: 5 }) },
        { data: () => ({ rating: 4 }) },
      ]
      const reviewsCollection = {
        add: addReview,
        where: jest
          .fn()
          .mockReturnThis()
          .mockReturnThis(),
        get: jest
          .fn()
          .mockResolvedValueOnce({ empty: true, docs: [] })
          .mockResolvedValueOnce({ empty: false, docs: publicReviewDocs }),
      }
      const usersDoc = makeDocRef()
      const publicProfilesDoc = makeDocRef()

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn((name: string) => {
          if (name === "workspaces") return workspacesCollection
          if (name === "reviews") return reviewsCollection
          if (name === "users") {
            return { doc: jest.fn(() => usersDoc) }
          }
          if (name === "publicProfiles") {
            return { doc: jest.fn(() => publicProfilesDoc) }
          }
          throw new Error(`Unexpected collection ${name}`)
        }),
      })

      const response = await submitReview(
        jsonRequest({
          workspaceId: "ws-1",
          rating: 5,
          title: "Great work",
          publicComment: "Excellent delivery",
          communicationRating: 5,
          professionalismRating: 5,
          timelinessRating: 4,
          skillRating: 5,
          privateFeedback: "Would hire again",
          isPublic: true,
          fromRole: "client",
        })
      )

      expect(response.status).toBe(200)
      expect(addReview).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: "ws-1",
          fromUserId: "user-1",
          toUserId: "user-2",
          toRole: "talent",
          skillRating: 5,
          privateFeedback: "Would hire again",
        })
      )
      expect(usersDoc.update).toHaveBeenCalledWith(
        expect.objectContaining({
          rating: { avg: 4.5, count: 2 },
          ratingBreakdown: { 1: 0, 2: 0, 3: 0, 4: 1, 5: 1 },
        })
      )
      expect(mockedNotifyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-2",
          type: "review",
        })
      )
    })
  })

  describe("platform reviews", () => {
    it("requires workspace participation and stores numeric review scores", async () => {
      const platformReviews = makeCollectionRef({ empty: true, addId: "platform-review-1" })
      const workspaceRef = makeDocRef({
        data: {
          clientUid: "user-1",
          talentUid: "user-2",
        },
      })

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn((name: string) => {
          if (name === "workspaces") {
            return { doc: jest.fn(() => workspaceRef) }
          }
          if (name === "platform_reviews") return platformReviews
          throw new Error(`Unexpected collection ${name}`)
        }),
      })

      const missingResponse = await submitPlatformReview(
        jsonRequest({
          workspaceId: "ws-1",
          comment: "",
          userName: "",
        }) as any
      )
      expect(missingResponse.status).toBe(400)

      const response = await submitPlatformReview(
        jsonRequest({
          workspaceId: "ws-1",
          rating: "5",
          easeOfUseRating: "4",
          supportRating: "5",
          valueRating: "4",
          comment: " Very smooth hiring and payout flow ",
          isPublic: true,
          userName: "Timi",
          userProfileImage: "https://img.test/u.png",
        }) as any
      )

      expect(response.status).toBe(200)
      expect(platformReviews.add).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: "ws-1",
          fromUserId: "user-1",
          fromRole: "client",
          rating: 5,
          easeOfUseRating: 4,
          supportRating: 5,
          valueRating: 4,
          comment: "Very smooth hiring and payout flow",
        })
      )
    })
  })

  describe("disputes", () => {
    it("only creates disputes for completed workspaces and notifies the other participant", async () => {
      const workspaceRef = makeDocRef({
        data: {
          clientUid: "user-1",
          talentUid: "user-2",
          status: "completed",
        },
      })
      const disputeRef = makeDocRef({ id: "dispute-123" })
      const disputesCollection = {
        doc: jest.fn(() => disputeRef),
      }

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn((name: string) => {
          if (name === "workspaces") {
            return { doc: jest.fn(() => workspaceRef) }
          }
          if (name === "disputes") return disputesCollection
          throw new Error(`Unexpected collection ${name}`)
        }),
      })

      const response = await createDispute(
        jsonRequest({
          workspaceId: "ws-1",
          raisedBy: "user-1",
          reason: "Deliverables incomplete",
          description: "Missing final assets",
        })
      )

      expect(response.status).toBe(200)
      expect(disputeRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          workspaceId: "ws-1",
          status: "open",
          stage: "discussion",
        })
      )
      expect(workspaceRef.update).toHaveBeenCalledWith({
        disputeStatus: "open",
        disputeId: "dispute-123",
      })
      expect(mockedNotifyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-2",
          type: "dispute",
        })
      )
    })
  })

  describe("workspace milestone and final delivery flow", () => {
    it("submits milestones as talent and lets the client review them", async () => {
      const milestoneRef = makeDocRef({
        data: {
          status: "draft",
        },
      })
      const workspaceRef = makeDocRef({
        data: {
          clientUid: "user-2",
          talentUid: "user-1",
        },
        subcollections: {
          milestones: {
            doc: jest.fn(() => milestoneRef),
          },
        },
      })

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn((name: string) => {
          if (name === "workspaces") {
            return { doc: jest.fn(() => workspaceRef) }
          }
          throw new Error(`Unexpected collection ${name}`)
        }),
      })

      const submitResponse = await submitMilestone(
        jsonRequest({
          workspaceId: "ws-1",
          milestoneId: "mile-1",
        })
      )

      expect(submitResponse.status).toBe(200)
      expect(milestoneRef.update).toHaveBeenCalledWith({
        status: "submitted",
        submittedAt: "SERVER_TIMESTAMP",
      })
      expect(mockedNotifyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-2",
          type: "milestone_submission",
        })
      )
      expect(mockedNotifyAdmins).toHaveBeenCalled()

      mockedGetAdminApp.mockReturnValue({
        auth: () => ({
          verifyIdToken: jest.fn(async () => ({ uid: "user-2" })),
        }),
      })

      const reviewResponse = await reviewMilestone(
        jsonRequest({
          workspaceId: "ws-1",
          milestoneId: "mile-1",
          decision: "approved",
        })
      )

      expect(reviewResponse.status).toBe(200)
      expect(milestoneRef.update).toHaveBeenLastCalledWith({
        status: "approved",
        reviewedAt: "SERVER_TIMESTAMP",
        reviewedBy: "user-2",
      })
      expect(mockedNotifyUser).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userId: "user-1",
          type: "milestone_approval",
          title: "Milestone approved",
        })
      )
    })

    it("submits final work as talent and completes the workspace when the client approves", async () => {
      const finalWorkRef = makeDocRef({
        data: {
          status: "draft",
        },
      })
      const workspaceRef = makeDocRef({
        data: {
          clientUid: "user-2",
          talentUid: "user-1",
        },
        subcollections: {
          finalWork: {
            doc: jest.fn(() => finalWorkRef),
          },
        },
      })

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn((name: string) => {
          if (name === "workspaces") {
            return { doc: jest.fn(() => workspaceRef) }
          }
          throw new Error(`Unexpected collection ${name}`)
        }),
      })

      const submitResponse = await submitFinalWork(
        jsonRequest({
          workspaceId: "ws-1",
        })
      )

      expect(submitResponse.status).toBe(200)
      expect(finalWorkRef.update).toHaveBeenCalledWith({
        status: "submitted",
        submittedAt: "SERVER_TIMESTAMP",
      })

      mockedGetAdminApp.mockReturnValue({
        auth: () => ({
          verifyIdToken: jest.fn(async () => ({ uid: "user-2" })),
        }),
      })

      const reviewResponse = await reviewFinalWork(
        jsonRequest({
          workspaceId: "ws-1",
          decision: "approved",
        })
      )

      expect(reviewResponse.status).toBe(200)
      expect(finalWorkRef.update).toHaveBeenLastCalledWith({
        status: "approved",
        approvedAt: "SERVER_TIMESTAMP",
        approvedBy: "user-2",
      })
      expect(workspaceRef.update).toHaveBeenCalledWith({
        status: "completed",
        completedAt: "SERVER_TIMESTAMP",
        finalWorkApproved: true,
      })
      expect(mockedNotifyUser).toHaveBeenLastCalledWith(
        expect.objectContaining({
          userId: "user-1",
          type: "final_work_approval",
          title: "Final work approved",
        })
      )
    })
  })

  describe("new gig talent alerts", () => {
    it("notifies only matched talents when a new open gig is posted", async () => {
      const gigRef = makeDocRef({
        id: "gig-1",
        data: {
          clientUid: "user-1",
          title: "Grant writer needed",
          status: "open",
          requiredSkills: ["Grant Writing", "Monitoring"],
          category: { group: "Writing", item: "Grant Writing" },
          sdgTags: ["Climate Action"],
          workMode: "Remote",
          location: "Lagos",
        },
      })

      const publicProfilesCollection = {
        where: jest.fn().mockReturnThis(),
        get: jest.fn().mockResolvedValue({
          docs: [
            {
              id: "talent-match",
              data: () => ({
                role: "talent",
                fullName: "Matched Talent",
                location: "Lagos",
                sdgTags: ["Climate Action"],
                verification: { status: "verified" },
                talent: { skills: ["Grant Writing", "Monitoring"], roleTitle: "Grant Writer", workMode: "Remote" },
                publicProfile: { categories: ["Grant Writing"] },
              }),
            },
            {
              id: "talent-nomatch",
              data: () => ({
                role: "talent",
                fullName: "No Match",
                location: "Abuja",
                sdgTags: ["Quality Education"],
                verification: { status: "verified" },
                talent: { skills: ["Design"], roleTitle: "Designer", workMode: "On-site" },
                publicProfile: { categories: ["Design"] },
              }),
            },
          ],
        }),
      }

      mockedGetAdminDb.mockReturnValue({
        collection: jest.fn((name: string) => {
          if (name === "gigs") {
            return { doc: jest.fn(() => gigRef) }
          }
          if (name === "publicProfiles") return publicProfilesCollection
          throw new Error(`Unexpected collection ${name}`)
        }),
      })

      const response = await notifyNewGig(
        jsonRequest({
          gigId: "gig-1",
          gigTitle: "Grant writer needed",
          clientUid: "user-1",
        }) as any
      )

      expect(response.status).toBe(200)
      expect(mockedNotifyAdmins).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "admin:gig",
        })
      )
      expect(mockedNotifyUser).toHaveBeenCalledTimes(1)
      expect(mockedNotifyUser).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "talent-match",
          type: "gig_match",
          link: "/dashboard/find-work/gig-1",
        })
      )
      expect(gigRef.set).toHaveBeenCalledWith(
        expect.objectContaining({
          matchedTalentNotificationCount: 1,
        }),
        { merge: true }
      )
    })
  })
})
