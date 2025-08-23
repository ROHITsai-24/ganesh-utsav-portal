import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET() {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get all game settings (public read access)
    const { data: settings, error } = await supabase
      .from('game_settings')
      .select('game_key, is_enabled, play_limit')
      .order('game_key')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Convert to key-value object for easier consumption
    const gameSettings = {}
    settings.forEach(setting => {
      gameSettings[setting.game_key] = {
        is_enabled: setting.is_enabled,
        play_limit: setting.play_limit || 1
      }
    })

    return NextResponse.json({ gameSettings })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
