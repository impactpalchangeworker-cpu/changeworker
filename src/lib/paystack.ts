const baseUrl = () => (process.env.PAYSTACK_BASE_URL || "https://api.paystack.co").replace(/\/$/, "")

export async function paystackRequest<T>(path: string, init: RequestInit = {}) {
  const secret = process.env.PAYSTACK_SECRET_KEY
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured")
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${secret}`, "Content-Type": "application/json", ...(init.headers || {}) },
    cache: "no-store",
  })
  const text = await response.text()
  let data: any
  try { data = JSON.parse(text) } catch { data = { status: false, message: text || "Paystack returned an invalid response" } }
  if (!response.ok || data?.status === false) throw new Error(data?.message || "Paystack request failed")
  return data as T
}

export async function verifyPaystackTransaction(reference: string) {
  const result = await paystackRequest<any>(`/transaction/verify/${encodeURIComponent(reference)}`)
  return result.data || {}
}

export async function createPaystackRecipient(input: { name: string; accountNumber: string; bankCode: string }) {
  const result = await paystackRequest<any>("/transferrecipient", { method: "POST", body: JSON.stringify({ type: "nuban", name: input.name, account_number: input.accountNumber, bank_code: input.bankCode, currency: "NGN" }) })
  return result.data
}

export async function initiatePaystackTransfer(input: { recipient: string; amount: number; reference: string; reason?: string }) {
  const result = await paystackRequest<any>("/transfer", { method: "POST", body: JSON.stringify({ source: "balance", recipient: input.recipient, amount: Math.round(input.amount * 100), reference: input.reference, reason: input.reason || "changeworker payment" }) })
  return result.data
}

export async function refundPaystackTransaction(input: { transaction: string; amount: number; reason?: string }) {
  const result = await paystackRequest<any>("/refund", { method: "POST", body: JSON.stringify({ transaction: input.transaction, amount: Math.round(input.amount * 100), merchant_note: input.reason || "Resolved project dispute" }) })
  return result.data
}
