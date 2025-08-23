import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL

    if (!supabaseUrl || !serviceRoleKey || !adminEmail) {
      return NextResponse.json({ error: 'Server not configured. Missing env vars.' }, { status: 500 })
    }

    // Simple admin gate: check header provided by client
    const reqAdminEmail = request.headers.get('x-admin-email') || ''
    if (reqAdminEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Get all game settings
    const { data: settings, error } = await adminClient
      .from('game_settings')
      .select('*')
      .order('game_key')

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ settings: settings || [] })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    const adminEmail = process.env.ADMIN_EMAIL || process.env.NEXT_PUBLIC_ADMIN_EMAIL

    if (!supabaseUrl || !serviceRoleKey || !adminEmail) {
      return NextResponse.json({ error: 'Server not configured. Missing env vars.' }, { status: 500 })
    }

    // Simple admin gate: check header provided by client
    const reqAdminEmail = request.headers.get('x-admin-email') || ''
    if (reqAdminEmail.toLowerCase() !== adminEmail.toLowerCase()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { gameKey, isEnabled } = await request.json()

    if (!gameKey || typeof isEnabled !== 'boolean') {
      return NextResponse.json({ error: 'Invalid request data' }, { status: 400 })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    // Update game setting
    const { data, error } = await adminClient
      .from('game_settings')
      .update({ 
        is_enabled: isEnabled,
        updated_at: new Date().toISOString()
      })
      .eq('game_key', gameKey)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, setting: data[0] })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
