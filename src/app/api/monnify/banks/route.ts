import { NextResponse } from "next/server"
import { getMonnifyBanks } from "@/lib/monnify"

export async function GET() {
  try {
    const banks = await getMonnifyBanks()
    return NextResponse.json({ banks: (banks || []).map((bank) => ({ name: bank.name, code: bank.code })).filter((bank) => bank.name && bank.code) })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Unable to load banks" }, { status: 500 })
  }
}
