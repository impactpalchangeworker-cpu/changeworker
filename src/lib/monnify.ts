import crypto from "crypto"

type MonnifyEnvelope<T> = {
  requestSuccessful?: boolean
  responseMessage?: string
  responseCode?: string
  responseBody?: T
}

const baseUrl = () => (process.env.MONNIFY_BASE_URL || "https://sandbox.monnify.com").replace(/\/$/, "")

function credentials() {
  const apiKey = process.env.MONNIFY_API_KEY
  const secretKey = process.env.MONNIFY_SECRET_KEY
  const contractCode = process.env.MONNIFY_CONTRACT_CODE
  if (!apiKey || !secretKey || !contractCode) {
    throw new Error("Monnify is not configured. Add MONNIFY_API_KEY, MONNIFY_SECRET_KEY, and MONNIFY_CONTRACT_CODE.")
  }
  return { apiKey, secretKey, contractCode }
}

async function readJson<T>(response: Response): Promise<MonnifyEnvelope<T>> {
  const text = await response.text()
  try {
    return JSON.parse(text) as MonnifyEnvelope<T>
  } catch {
    throw new Error(text || "Monnify returned an invalid response")
  }
}

export async function getMonnifyAccessToken() {
  const { apiKey, secretKey } = credentials()
  const response = await fetch(`${baseUrl()}/api/v1/auth/login`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${apiKey}:${secretKey}`).toString("base64")}`,
      "Content-Type": "application/json",
    },
    cache: "no-store",
  })
  const data = await readJson<{ accessToken?: string }>(response)
  const accessToken = data.responseBody?.accessToken
  if (!response.ok || !data.requestSuccessful || !accessToken) {
    throw new Error(data.responseMessage || "Unable to authenticate with Monnify")
  }
  return accessToken
}

export async function monnifyRequest<T>(path: string, init: RequestInit = {}) {
  const accessToken = await getMonnifyAccessToken()
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
    cache: "no-store",
  })
  const data = await readJson<T>(response)
  if (!response.ok || !data.requestSuccessful) {
    throw new Error(data.responseMessage || "Monnify request failed")
  }
  return data.responseBody as T
}

export async function initializeMonnifyTransaction(input: {
  amount: number
  customerEmail: string
  customerName: string
  reference: string
  description: string
  redirectUrl: string
  metadata: Record<string, unknown>
}) {
  const { contractCode } = credentials()
  return monnifyRequest<{ checkoutUrl?: string; transactionReference?: string }>(
    "/api/v1/merchant/transactions/init-transaction",
    {
      method: "POST",
      body: JSON.stringify({
        amount: input.amount,
        customerEmail: input.customerEmail,
        customerName: input.customerName,
        paymentReference: input.reference,
        paymentDescription: input.description,
        currencyCode: "NGN",
        contractCode,
        redirectUrl: input.redirectUrl,
        paymentMethods: ["CARD", "ACCOUNT_TRANSFER", "USSD", "PHONE_NUMBER"],
        metadata: input.metadata,
      }),
    }
  )
}

export async function verifyMonnifyTransaction(reference: string) {
  return monnifyRequest<{ paymentStatus?: string; amountPaid?: number; transactionReference?: string; paymentMethod?: string }>(
    `/api/v2/merchant/transactions/query?paymentReference=${encodeURIComponent(reference)}`
  )
}

export async function verifyBankAccount(accountNumber: string, bankCode: string) {
  return monnifyRequest<{ accountNumber?: string; accountName?: string; bankCode?: string; bankName?: string }>(
    `/api/v2/disbursements/account/validate?accountNumber=${encodeURIComponent(accountNumber)}&bankCode=${encodeURIComponent(bankCode)}`
  )
}

export async function getMonnifyBanks() {
  return monnifyRequest<Array<{ name?: string; code?: string }>>("/api/v1/sdk/transactions/banks")
}

export async function initiateMonnifyDisbursement(input: {
  amount: number
  reference: string
  narration: string
  destinationBankCode: string
  destinationAccountNumber: string
  destinationAccountName: string
  sourceAccountNumber: string
}) {
  return monnifyRequest<{ status?: string; transactionReference?: string; fee?: number }>(
    "/api/v2/disbursements/single",
    {
      method: "POST",
      body: JSON.stringify({ ...input, currency: "NGN", async: true }),
    }
  )
}

export async function initiateMonnifyRefund(input: {
  transactionReference: string
  refundReference: string
  amount: number
  reason: string
}) {
  return monnifyRequest<{ refundStatus?: string; refundReference?: string }>(
    "/api/v1/refunds/initiate-refund",
    {
      method: "POST",
      body: JSON.stringify({
        transactionReference: input.transactionReference,
        refundReference: input.refundReference,
        refundAmount: input.amount,
        refundReason: input.reason.slice(0, 64),
        customerNote: "Project refund",
      }),
    }
  )
}

export function hasValidMonnifySignature(rawBody: Buffer, signature: string) {
  const secretKey = process.env.MONNIFY_SECRET_KEY
  if (!secretKey || !signature) return false
  // Monnify signs webhooks by hashing the client secret followed by the exact
  // raw request body. Do not parse and re-stringify the payload before checking.
  const expected = crypto.createHash("sha512").update(secretKey).update(rawBody).digest("hex")
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature))
  } catch {
    return false
  }
}
