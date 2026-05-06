import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'spinly-marketing',
    timestamp: new Date().toISOString()
  })
}
