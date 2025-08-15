import { NextResponse } from 'next/server'

// Lightweight admin check endpoint - only verifies admin status
export async function GET(request) {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    
    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email not configured' }, { status: 500 })
    }

    // Check if the requesting user's email matches admin email
    const reqAdminEmail = request.headers.get('x-admin-email') || ''
    if (reqAdminEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ authorized: true })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}


