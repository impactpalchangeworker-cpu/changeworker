import admin from "firebase-admin"
import { NextResponse } from "next/server"
import { getAdminApp, getAdminDb } from "@/lib/firebaseAdmin"
import { verifyBankAccount } from "@/lib/monnify"

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get("authorization") || ""
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : ""
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const decoded = await getAdminApp().auth().verifyIdToken(token)
    const { accountNumber, bankCode } = await req.json()
    if (!/^\d{10}$/.test(String(accountNumber || "")) || !bankCode) return NextResponse.json({ error: "Provide a valid account number and bank" }, { status: 400 })
    const bank = await verifyBankAccount(String(accountNumber), String(bankCode))
    await getAdminDb().collection("payoutProfiles").doc(decoded.uid).set({ bank: { accountNumber: bank.accountNumber || accountNumber, accountName: bank.accountName || "", bankCode: bank.bankCode || bankCode, bankName: bank.bankName || "", verifiedAt: admin.firestore.FieldValue.serverTimestamp(), provider: "monnify" }, updatedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true })
    return NextResponse.json({ accountNumber: bank.accountNumber, accountName: bank.accountName, bankCode: bank.bankCode, bankName: bank.bankName })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to verify this bank account" }, { status: 400 })
  }
}
