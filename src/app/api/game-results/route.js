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

    // Check if user already has a result for this game
    const { data: existingResult, error: fetchError } = await supabase
      .from('game_results')
      .select('id, score, details')
      .eq('user_id', user_id)
      .eq('game_id', game_id)
      .single()

    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      return NextResponse.json({ error: fetchError.message }, { status: 500 })
    }

    // Optimized score comparison logic
    const shouldUpdate = existingResult && (
      score > existingResult.score || 
      (score === existingResult.score && (details.time_taken || 0) < (existingResult.details?.time_taken || 0))
    )
    
    const shouldInsert = !existingResult

    let result
    let action

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
      action = 'updated'
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
      action = 'inserted'
    } else {
      // No update needed - return existing result
      result = existingResult
      action = 'no_change'
    }
     
    return NextResponse.json({ 
      success: true, 
      result,
      action
    })

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
