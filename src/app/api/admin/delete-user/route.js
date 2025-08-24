import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function DELETE(request) {
  try {
    // Add cache busting headers to prevent stale data
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Prefer server-only SUPABASE_URL if present, otherwise fall back to NEXT_PUBLIC
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL

    if (!supabaseUrl || !serviceRoleKey || !adminEmail) {
      return NextResponse.json({ error: 'Server not configured. Missing env vars.' }, { status: 500 })
    }

    // Simple admin gate: check header provided by client
    const reqAdminEmail = request.headers.get('x-admin-email') || ''
    if (reqAdminEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Get request body
    const { userId } = await request.json()

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    // First, delete all game results for this user
    const { error: gameResultsError } = await adminClient
      .from('game_results')
      .delete()
      .eq('user_id', userId)

    if (gameResultsError) {
      console.error('Error deleting game results:', gameResultsError)
      return NextResponse.json({ error: gameResultsError.message }, { status: 500 })
    }

    // Then, delete the user from auth
    const { error: userError } = await adminClient.auth.admin.deleteUser(userId)

    if (userError) {
      console.error('Error deleting user:', userError)
      return NextResponse.json({ error: userError.message }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'User and all associated data deleted successfully' 
    })

  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete user' 
    }, { status: 500 })
  }
}
