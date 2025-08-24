import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { user_id, game_id, score, details } = await request.json()
    
    if (!user_id || !game_id || score === undefined || !details) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get game key from game_id
    const { data: game, error: gameError } = await supabase
      .from('games')
      .select('key')
      .eq('id', game_id)
      .single()

    if (gameError || !game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    // Verify game is enabled
    const { data: gameSetting, error: settingError } = await supabase
      .from('game_settings')
      .select('is_enabled, play_limit')
      .eq('game_key', game.key)
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

    // Check play limit
    const playLimit = gameSetting.play_limit || 1
    const { data: transactionResult, error: transactionError } = await supabase.rpc('check_and_enforce_play_limit', {
      p_user_id: user_id,
      p_game_id: game_id,
      p_play_limit: playLimit
    })

    if (transactionError) {
      // Fallback to manual check
      const { count: playCount, error: countError } = await supabase
        .from('game_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('game_id', game_id)

      if (countError) {
        return NextResponse.json({ error: countError.message }, { status: 500 })
      }

      if ((playCount || 0) >= playLimit) {
        return NextResponse.json({ 
          error: 'Play limit reached',
          action: 'rejected_limit',
          playCount: playCount || 0,
          playLimit: playLimit
        }, { status: 403 })
      }
    } else if (transactionResult && transactionResult.limit_reached) {
      return NextResponse.json({ 
        error: 'Play limit reached',
        action: 'rejected_limit',
        playCount: transactionResult.current_count,
        playLimit: playLimit
      }, { status: 403 })
    }

    // Check if user already has a result
    const { data: existingResult, error: fetchError } = await supabase
      .from('game_results')
      .select('id, score, details')
      .eq('user_id', user_id)
      .eq('game_id', game_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') {
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    let result, action

    if (existingResult) {
      // Check if new score is better
      const currentScore = existingResult.score || 0
      const currentTime = existingResult.details?.time_taken || 0
      const currentAttempts = existingResult.details?.attempts || 1
      const newScore = score || 0
      const newTime = details?.time_taken || 0

      const shouldUpdate = newScore > currentScore || 
                          (newScore === currentScore && newTime < currentTime)
      
      if (shouldUpdate) {
        // Update with better score
        const updatedDetails = { ...details, attempts: currentAttempts + 1 }
        const { data, error } = await supabase
          .from('game_results')
          .update({ score, details: updatedDetails })
          .eq('id', existingResult.id)
          .select()

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        result = data[0]
        action = 'updated'
      } else {
        // Track attempt even if score isn't better
        const updatedDetails = { ...existingResult.details, attempts: currentAttempts + 1 }
        const { error } = await supabase
          .from('game_results')
          .update({ details: updatedDetails })
          .eq('id', existingResult.id)

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        return NextResponse.json({ 
          error: 'Score not better than existing result',
          action: 'rejected_score',
          existingScore: currentScore,
          existingTime: currentTime,
          newScore: newScore,
          newTime: newTime,
          attemptsTracked: true
        }, { status: 409 })
      }
    } else {
      // Insert new result
      const updatedDetails = { ...details, attempts: 1 }
      const { data, error } = await supabase
        .from('game_results')
        .insert([{ user_id, game_id, score, details: updatedDetails }])
        .select()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data[0]
      action = 'inserted'
    }
     
    return NextResponse.json({ 
      success: true, 
      result,
      action,
      safetyChecks: {
        gameEnabled: gameSetting.is_enabled,
        playLimit: playLimit,
        currentPlayCount: transactionResult ? transactionResult.current_count : 'unknown',
        canPlay: true
      }
    })

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
