import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const gameKey = searchParams.get('gameKey')

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
      .select('play_limit')
      .eq('game_key', gameKey)
      .single()

    if (settingError || !gameSetting) {
      return NextResponse.json({ error: 'Game settings not found' }, { status: 404 })
    }

    const playLimit = gameSetting.play_limit || 1

    // Count user's plays for this game
    const { count, error: countError } = await supabase
      .from('game_results')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('game_id', game.id)

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 })
    }

    const playCount = count || 0
    const canPlay = playCount < playLimit

    return NextResponse.json({
      playCount,
      playLimit,
      canPlay,
      remainingPlays: Math.max(0, playLimit - playCount)
    })

  } catch (error) {
    return NextResponse.json({ error: error.message || 'Unknown error' }, { status: 500 })
  }
}
