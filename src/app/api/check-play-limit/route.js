import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { userId, gameKey } = await request.json()
    
    console.log('🔍 Play limit check requested:', { userId, gameKey })
    
    // Input validation
    if (!userId || !gameKey) {
      console.log('❌ Missing userId or gameKey')
      return NextResponse.json({ error: 'Missing userId or gameKey' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Server not configured')
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
      console.log('❌ Game not found:', gameError)
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    console.log('✅ Game found:', game)

    // Get play limit for this game
    const { data: gameSetting, error: settingError } = await supabase
      .from('game_settings')
      .select('is_enabled, play_limit')
      .eq('game_key', gameKey)
      .single()

    if (settingError || !gameSetting) {
      console.log('❌ Game settings not found:', settingError)
      return NextResponse.json({ error: 'Game settings not found' }, { status: 404 })
    }

    console.log('✅ Game settings found:', gameSetting)

    if (!gameSetting.is_enabled) {
      console.log('❌ Game is disabled')
      return NextResponse.json({ 
        error: 'Game is currently disabled',
        action: 'rejected_disabled'
      }, { status: 403 })
    }

    const playLimit = gameSetting.play_limit || 1
    console.log('📊 Play limit:', playLimit)

    // Use transaction to check play limit atomically
    const { data: transactionResult, error: transactionError } = await supabase.rpc('check_and_enforce_play_limit', {
      p_user_id: userId,
      p_game_id: game.id,
      p_play_limit: playLimit
    })

    console.log('🔄 Transaction result:', transactionResult, 'Error:', transactionError)

    // ALWAYS do a manual check as backup, regardless of transaction result
    // But we need to count ATTEMPTS, not just saved records
    const { count: manualPlayCount, error: manualCountError } = await supabase
      .from('game_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('game_id', game.id)

    if (manualCountError) {
      console.log('❌ Manual count error:', manualCountError)
      return NextResponse.json({ error: manualCountError.message }, { status: 500 })
    }

    // Also get the actual records to debug
    const { data: actualRecords, error: recordsError } = await supabase
      .from('game_results')
      .select('id, score, created_at, details')
      .eq('user_id', userId)
      .eq('game_id', game.id)
      .order('created_at', { ascending: false })

    if (recordsError) {
      console.log('❌ Records fetch error:', recordsError)
    } else {
      console.log('📋 Actual records in database:', actualRecords)
    }

    // CRITICAL FIX: Count actual game attempts, not just saved records
    // If user has ANY record, they've attempted at least 1 game
    // If they have multiple records (due to updates), count the attempts
    let actualAttempts = 0
    if (actualRecords && actualRecords.length > 0) {
      // Count attempts based on the details field which should contain attempt info
      actualAttempts = actualRecords.reduce((total, record) => {
        const attempts = record.details?.attempts || 1
        return total + attempts
      }, 0)
      
      // If no attempt info in details, assume each record = 1 attempt
      if (actualAttempts === 0) {
        actualAttempts = actualRecords.length
      }
    }

    // IMPORTANT: Add 1 for the current attempt that's about to happen
    const currentPlayCount = actualAttempts + 1
    const canPlay = currentPlayCount <= playLimit

    console.log('📊 FINAL CHECK - Actual attempts:', { 
      currentPlayCount, 
      playLimit, 
      canPlay,
      existingAttempts: actualAttempts,
      currentAttempt: 1
    })
    console.log('🔍 Debug info:', { 
      userId, 
      gameId: game.id, 
      gameKey,
      totalRecords: actualRecords?.length || 0,
      manualCount: manualPlayCount,
      actualAttempts: actualAttempts,
      currentAttempt: 1
    })

    if (!canPlay) {
      console.log('🚫 PLAY LIMIT EXCEEDED - Blocking user from playing')
      return NextResponse.json({
        canPlay: false,
        playCount: actualAttempts, // Show actual attempts, not +1
        playLimit,
        remainingPlays: 0,
        gameEnabled: gameSetting.is_enabled,
        action: 'rejected_limit'
      })
    }

    return NextResponse.json({
      canPlay: true,
      playCount: currentPlayCount,
      playLimit,
      remainingPlays: Math.max(0, playLimit - currentPlayCount),
      gameEnabled: gameSetting.is_enabled
    })

  } catch (error) {
    console.log('❌ Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
