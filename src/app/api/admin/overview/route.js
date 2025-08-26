import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// This route runs only on the server. Requires SUPABASE_SERVICE_ROLE_KEY and ADMIN_EMAIL in env.

export async function GET(request) {
  try {
    // Add cache busting headers to prevent stale data
    const response = NextResponse.next()
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Prefer server-only SUPABASE_URL if present, otherwise fall back to NEXT_PUBLIC
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

    // Get all users (email, id, metadata)
    const { data: usersList, error: usersErr } = await adminClient.auth.admin.listUsers()
    if (usersErr) {
      return NextResponse.json({ error: usersErr.message }, { status: 500 })
    }

    const flatUsers = (usersList?.users || []).map(u => ({
      id: u.id,
      email: u.email,
      username: u.user_metadata?.username || null,
      readable_id: u.user_metadata?.readable_id || null,
      created_at: u.created_at,
      last_sign_in_at: u.last_sign_in_at,
    }))

    // Read unified game_results with games
    const { data: results, error: resErr } = await adminClient
      .from('game_results')
      .select('id, user_id, score, details, created_at, games!inner ( id, key, name )')
      .not('user_id', 'is', null) // Filter out orphaned records with null user_id
    if (resErr) {
      return NextResponse.json({ error: resErr.message }, { status: 500 })
    }

    const userIdToAgg = new Map()
    for (const row of results || []) {
      const current = userIdToAgg.get(row.user_id) || { gamesPlayed: 0, totalScore: 0, lastPlayed: null }
      current.gamesPlayed += 1
      current.totalScore += Number(row.score || 0)
      if (!current.lastPlayed || new Date(row.created_at) > new Date(current.lastPlayed)) {
        current.lastPlayed = row.created_at
      }
      userIdToAgg.set(row.user_id, current)
    }

    // Merge into final records; include users with zero stats
    const records = flatUsers.map(u => {
      const agg = userIdToAgg.get(u.id) || { gamesPlayed: 0, totalScore: 0, lastPlayed: null }
      return {
        userId: u.id,
        email: u.email,
        username: u.username,
        readableId: u.readable_id,
        createdAt: u.created_at,
        lastSignInAt: u.last_sign_in_at,
        gamesPlayed: agg.gamesPlayed,
        totalScore: agg.totalScore,
        lastPlayed: agg.lastPlayed,
      }
    })

    // Sort by totalScore desc, then gamesPlayed desc
    records.sort((a, b) => (b.totalScore - a.totalScore) || (b.gamesPlayed - a.gamesPlayed))

    // Flatten result rows for per-game dashboards
    const flatScores = (results || []).map(r => {
      const timeTaken = r.details?.time_taken ?? null
      const user = flatUsers.find(u => u.id === r.user_id)
      
      return {
        id: r.id,
        user_id: r.user_id,
        score: r.score,
        created_at: r.created_at,
        game_key: r.games?.key,
        game_name: r.games?.name,
        moves: r.details?.moves ?? null,
        time_taken_seconds: timeTaken,
        // Add user details for display
        user_email: user?.email || null,
        user_username: user?.username || null,
        user_readable_id: user?.readable_id || null,
      }
    })

    return NextResponse.json({ users: records, scores: flatScores })
  } catch (e) {
    return NextResponse.json({ error: e?.message || 'Unknown error' }, { status: 500 })
  }
}
