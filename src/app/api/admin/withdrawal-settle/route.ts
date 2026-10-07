import { NextResponse } from "next/server"

// Legacy wallet withdrawals are intentionally disabled. New project payments use Monnify disbursements.
export async function POST() {
  return NextResponse.json({ error: "Legacy wallet withdrawals are no longer available." }, { status: 410 })
}
