import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { userId, gameKey } = await request.json()
    
    if (!userId || !gameKey) {
      return NextResponse.json({ error: 'Missing userId or gameKey' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get game ID
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('id')
      .eq('key', gameKey)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Get play limit for this game
    const { data: gameSetting, error: settingError } = await supabase
      .from('game_settings')
      .select('is_enabled, play_limit')
      .eq('game_key', gameKey)
      .single()

    if (settingError || !gameSetting) {
      return NextResponse.json({ error: 'Game settings not found' }, { status: 404 })
    }

    if (!gameSetting.is_enabled) {
      return NextResponse.json({ 
        error: 'Game is currently disabled',
        action: 'rejected_disabled'
      }, { status: 403 })
    }

    const playLimit = gameSetting.play_limit || 1

    // Get actual records to count attempts
    const { data: actualRecords, error: recordsError } = await supabase
      .from('game_results')
      .select('details')
      .eq('user_id', userId)
      .eq('game_id', game.id)

    if (recordsError) {
      return NextResponse.json({ error: recordsError.message }, { status: 500 })
    }

    // Count actual attempts from details field
    let actualAttempts = 0
    if (actualRecords && actualRecords.length > 0) {
      actualAttempts = actualRecords.reduce((total, record) => {
        return total + (record.details?.attempts || 1)
      }, 0)
      
      if (actualAttempts === 0) {
        actualAttempts = actualRecords.length
      }
    }

    // Check if current attempt would exceed limit
    const canPlay = (actualAttempts + 1) <= playLimit

    if (!canPlay) {
      return NextResponse.json({
        canPlay: false,
        playCount: actualAttempts,
        playLimit,
        remainingPlays: 0,
        gameEnabled: gameSetting.is_enabled,
        action: 'rejected_limit'
      })
    }

    return NextResponse.json({
      canPlay: true,
      playCount: actualAttempts,
      playLimit,
      remainingPlays: Math.max(0, playLimit - actualAttempts),
      gameEnabled: gameSetting.is_enabled
    })

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
