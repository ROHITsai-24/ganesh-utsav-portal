import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { user_id, game_id, score, details } = await request.json()
    
    // Input validation
    if (!user_id || !game_id || score === undefined || !details) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // SAFETY CHECK 1: Get game key from game_id
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('key')
      .eq('id', game_id)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const gameKey = game.key

    // SAFETY CHECK 2: Verify game is enabled
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

    // SAFETY CHECK 3: Check user's play count against limit
    const { count: playCount, error: countError } = await supabase
      .from('game_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user_id)
      .eq('game_id', game_id)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const currentPlayCount = playCount || 0
    const playLimit = gameSetting.play_limit || 1

    if (currentPlayCount >= playLimit) {
      return NextResponse.json({ 
        error: 'Play limit reached',
        action: 'rejected_limit',
        playCount: currentPlayCount,
        playLimit: playLimit
      }, { status: 403 })
    }

    // SAFETY CHECK 4: Check if user already has a result for this game
    const { data: existingResult, error: fetchError } = await supabase
      .from('game_results')
      .select('id, score, details')
      .eq('user_id', user_id)
      .eq('game_id', game_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // SAFETY CHECK 5: Best score comparison logic with additional validation
    let shouldUpdate = false
    let shouldInsert = false
    let action = 'no_change'
    let result = existingResult

    if (existingResult) {
      // User has existing result - check if new score is better
      const currentScore = existingResult.score || 0
      const currentTime = existingResult.details?.time_taken || 0
      const newScore = score || 0
      const newTime = details?.time_taken || 0

      // Only update if new score is higher, or same score but faster time
      shouldUpdate = newScore > currentScore || 
                    (newScore === currentScore && newTime < currentTime)
      
      if (shouldUpdate) {
        action = 'updated'
      } else {
        // New score is not better - reject the save
        return NextResponse.json({ 
          error: 'Score not better than existing result',
          action: 'rejected_score',
          existingScore: currentScore,
          existingTime: currentTime,
          newScore: newScore,
          newTime: newTime
        }, { status: 409 })
      }
    } else {
      // User has no existing result - safe to insert
      shouldInsert = true
      action = 'inserted'
    }

    // SAFETY CHECK 6: Final save operation
    if (shouldUpdate) {
      // Update existing result with better score
      const { data, error } = await supabase
        .from('game_results')
        .update({ score, details })
        .eq('id', existingResult.id)
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data[0]
    } else if (shouldInsert) {
      // Insert new result
      const { data, error } = await supabase
        .from('game_results')
        .insert([{ user_id, game_id, score, details }])
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data[0]
    }
     
    return NextResponse.json({ 
      success: true, 
      result,
      action,
      safetyChecks: {
        gameEnabled: gameSetting.is_enabled,
        playLimit: playLimit,
        currentPlayCount: currentPlayCount,
        canPlay: currentPlayCount < playLimit
      }
    })

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
