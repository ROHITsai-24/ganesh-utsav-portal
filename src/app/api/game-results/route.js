import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request) {
  try {
    const { user_id, game_id, score, details } = await request.json()
    
    console.log('🎮 Game result save requested:', { user_id, game_id, score })
    
    // Input validation
    if (!user_id || !game_id || score === undefined || !details) {
      console.log('❌ Missing required fields')
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      console.log('❌ Server not configured')
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
      console.log('❌ Game not found:', gameError)
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    const gameKey = game.key
    console.log('✅ Game found:', gameKey)

    // SAFETY CHECK 2: Verify game is enabled
    const { data: gameSetting, error: settingError } = await supabase
      .from('game_settings')
      .select('is_enabled, play_limit')
      .eq('game_key', gameKey)
      .single()

    if (settingError || !gameSetting) {
      console.log('❌ Game settings not found:', settingError)
      return NextResponse.json({ error: 'Game settings not found' }, { status: 404 })
    }

    console.log('✅ Game settings:', gameSetting)

    if (!gameSetting.is_enabled) {
      console.log('❌ Game is disabled')
      return NextResponse.json({ 
        error: 'Game is currently disabled',
        action: 'rejected_disabled'
      }, { status: 403 })
    }

    // ENHANCED SAFETY CHECK 3: Early play limit validation with transaction
    const playLimit = gameSetting.play_limit || 1
    console.log('📊 Checking play limit:', { user_id, game_id, playLimit })
    
    // Use a transaction to prevent race conditions
    const { data: transactionResult, error: transactionError } = await supabase.rpc('check_and_enforce_play_limit', {
      p_user_id: user_id,
      p_game_id: game_id,
      p_play_limit: playLimit
    })

    console.log('🔄 Transaction result:', transactionResult, 'Error:', transactionError)

    if (transactionError) {
      console.log('⚠️ Transaction error, falling back to manual check:', transactionError)
      // Fallback to manual check if transaction fails - count ALL plays (no daily limit)
      const { count: playCount, error: countError } = await supabase
        .from('game_results')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user_id)
        .eq('game_id', game_id)

      if (countError) {
        console.log('❌ Count error:', countError)
        return NextResponse.json({ error: countError.message }, { status: 500 })
      }

      const currentPlayCount = playCount || 0
      console.log('📊 Manual check - Current play count:', currentPlayCount, 'Limit:', playLimit)
      
      if (currentPlayCount >= playLimit) {
        console.log('❌ Play limit exceeded (manual check)')
        return NextResponse.json({ 
          error: 'Play limit reached',
          action: 'rejected_limit',
          playCount: currentPlayCount,
          playLimit: playLimit
        }, { status: 403 })
      }
    } else if (transactionResult && transactionResult.limit_reached) {
      console.log('❌ Play limit exceeded (transaction check):', transactionResult)
      return NextResponse.json({ 
        error: 'Play limit reached',
        action: 'rejected_limit',
        playCount: transactionResult.current_count,
        playLimit: playLimit
      }, { status: 403 })
    }

    console.log('✅ Play limit check passed, proceeding with save')

    // SAFETY CHECK 4: Check if user already has a result for this game (anytime)
    const { data: existingResult, error: fetchError } = await supabase
      .from('game_results')
      .select('id, score, details')
      .eq('user_id', user_id)
      .eq('game_id', game_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.log('❌ Fetch error:', fetchError)
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
      const currentAttempts = existingResult.details?.attempts || 1
      const newScore = score || 0
      const newTime = details?.time_taken || 0

      console.log('📊 Score comparison:', { 
        currentScore, 
        newScore, 
        currentTime, 
        newTime,
        currentAttempts,
        shouldUpdate: newScore > currentScore || (newScore === currentScore && newTime < currentTime)
      })

      // Only update if new score is higher, or same score but faster time
      shouldUpdate = newScore > currentScore || 
                    (newScore === currentScore && newTime < currentTime)
      
      if (shouldUpdate) {
        action = 'updated'
        // Increment attempt count when updating
        const updatedDetails = {
          ...details,
          attempts: currentAttempts + 1
        }
        console.log('✅ Updating existing result with better score, attempts:', currentAttempts + 1)
        
        // Update the score and details with attempt count
        const { data, error } = await supabase
          .from('game_results')
          .update({ score, details: updatedDetails })
          .eq('id', existingResult.id)
          .select()

        if (error) {
          console.log('❌ Update error:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        result = data[0]
      } else {
        // New score is not better - but we still need to track the attempt
        console.log('❌ Score not better than existing, but tracking attempt')
        
        // Update the record to increment attempts even though score doesn't change
        const updatedDetails = {
          ...existingResult.details,
          attempts: currentAttempts + 1
        }
        
        const { data, error } = await supabase
          .from('game_results')
          .update({ details: updatedDetails })
          .eq('id', existingResult.id)
          .select()

        if (error) {
          console.log('❌ Attempt tracking update error:', error)
          return NextResponse.json({ error: error.message }, { status: 500 })
        }
        
        console.log('✅ Attempt tracked (score not better), attempts:', currentAttempts + 1)
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
      // User has no existing result - safe to insert
      shouldInsert = true
      action = 'inserted'
      // Set initial attempt count
      const updatedDetails = {
        ...details,
        attempts: 1
      }
      console.log('✅ Inserting new result, attempts: 1')
      
      // Insert new result with attempt count
      const { data, error } = await supabase
        .from('game_results')
        .insert([{ user_id, game_id, score, details: updatedDetails }])
        .select()

      if (error) {
        console.log('❌ Insert error:', error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      result = data[0]
    }
     
    console.log('✅ Score saved successfully:', action)
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
    console.log('❌ Unexpected error:', error)
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
