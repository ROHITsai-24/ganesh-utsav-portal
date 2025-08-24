import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { generateUniqueUserId } from '@/lib/userIdGenerator'

export async function POST(request) {
  try {
    // Add cache busting headers
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: 'Server not configured. Missing env vars.' }, { status: 500 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Generate unique user ID
    const uniqueId = await generateUniqueUserId()

    return NextResponse.json({ 
      success: true, 
      userId: uniqueId,
      message: 'Unique user ID generated successfully' 
    })

  } catch (error) {
    console.error('Generate user ID error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to generate user ID' 
    }, { status: 500 })
  }
}
