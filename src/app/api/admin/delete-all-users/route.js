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

    // Get all users (excluding admin)
    const { data: usersList, error: usersErr } = await adminClient.auth.admin.listUsers()
    if (usersErr) {
      return NextResponse.json({ error: usersErr.message }, { status: 500 })
    }

    // Filter out admin user
    const usersToDelete = usersList.users.filter(user => 
      user.email?.toLowerCase() !== adminEmail.toLowerCase()
    )

    if (usersToDelete.length === 0) {
      return NextResponse.json({ 
        success: true, 
        message: 'No users to delete (admin user is protected)' 
      })
    }

    // Delete all game results first
    const { error: gameResultsError } = await adminClient
      .from('game_results')
      .delete()
      .neq('user_id', '00000000-0000-0000-0000-000000000000') // Delete all game results

    if (gameResultsError) {
      console.error('Error deleting all game results:', gameResultsError)
      return NextResponse.json({ error: gameResultsError.message }, { status: 500 })
    }

    // Delete all users (excluding admin)
    let deletedCount = 0
    let errors = []

    for (const user of usersToDelete) {
      try {
        const { error: userError } = await adminClient.auth.admin.deleteUser(user.id)
        if (userError) {
          console.error(`Error deleting user ${user.email}:`, userError)
          errors.push(`Failed to delete ${user.email}: ${userError.message}`)
        } else {
          deletedCount++
        }
      } catch (error) {
        console.error(`Error deleting user ${user.email}:`, error)
        errors.push(`Failed to delete ${user.email}: ${error.message}`)
      }
    }

    if (errors.length > 0) {
      return NextResponse.json({ 
        success: false, 
        message: `Deleted ${deletedCount} users, but encountered errors: ${errors.join('; ')}` 
      }, { status: 207 }) // 207 Multi-Status
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted ${deletedCount} users and all their game results` 
    })

  } catch (error) {
    console.error('Delete all users error:', error)
    return NextResponse.json({ 
      error: error.message || 'Failed to delete all users' 
    }, { status: 500 })
  }
}
