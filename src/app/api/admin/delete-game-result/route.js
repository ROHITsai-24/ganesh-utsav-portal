import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request) {
  try {
    // Get admin email from headers
    const adminEmail = request.headers.get('x-admin-email')
    
    if (!adminEmail) {
      return NextResponse.json({ error: 'Admin email required' }, { status: 400 })
    }

    // Verify admin email matches environment variable
    const expectedAdminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL
    if (adminEmail !== expectedAdminEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Get game result ID from request body
    const { gameResultId } = await request.json()
    
    if (!gameResultId) {
      return NextResponse.json({ error: 'Game result ID required' }, { status: 400 })
    }

    // Delete the game result from the database
    const { error } = await supabase
      .from('game_results')
      .delete()
      .eq('id', gameResultId)

    if (error) {
      console.error('Database delete error:', error)
      return NextResponse.json({ error: 'Failed to delete game result' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Game result deleted successfully' 
    })

  } catch (error) {
    console.error('Delete game result error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
