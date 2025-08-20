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

    // Get game key from request body
    const { gameKey } = await request.json()
    
    if (!gameKey) {
      return NextResponse.json({ error: 'Game key required' }, { status: 400 })
    }

    // First get the game ID from the games table using the key
    const { data: gameData, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('key', gameKey)
      .single()

    if (gameError || !gameData) {
      console.error('Failed to find game:', gameError)
      return NextResponse.json({ error: 'Game not found' }, { status: 400 })
    }

    // Delete all game results for this game ID
    const { error } = await supabase
      .from('game_results')
      .delete()
      .eq('game_id', gameData.id)

    if (error) {
      console.error('Database delete error:', error)
      return NextResponse.json({ error: 'Failed to delete game results' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully deleted all game results for ${gameKey}`,
      deletedCount: 'all'
    })

  } catch (error) {
    console.error('Delete all game results error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
