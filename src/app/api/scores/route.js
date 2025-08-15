import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request) {
  try {
    const { user_id, score, idol_name, user_guess } = await request.json()

    const { data, error } = await supabase
      .from('game_scores')
      .insert([
        {
          user_id,
          score,
          idol_name,
          user_guess
        }
      ])
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { data, error } = await supabase
      .from('game_scores')
      .select(`
        score,
        idol_name,
        user_guess,
        created_at,
        users:user_id (
          email,
          user_metadata
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ data })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
} 