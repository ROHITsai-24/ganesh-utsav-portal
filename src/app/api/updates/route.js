import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Configuration object for public updates API
const UPDATES_API_CONFIG = {
  // Database table name
  table: 'updates',
  // Error messages
  errors: {
    databaseNotConfigured: 'Database not configured',
    failedToFetch: 'Failed to fetch updates',
    internalError: 'Internal server error'
  },
  // HTTP status codes
  status: {
    internalError: 500
  },
  // Database query options
  query: {
    orderBy: 'created_at',
    orderDirection: 'desc'
  }
}

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET() {
  try {
    // Check if Supabase is properly configured
    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ 
        error: UPDATES_API_CONFIG.errors.databaseNotConfigured 
      }, { status: UPDATES_API_CONFIG.status.internalError })
    }
    
    // Fetch all updates ordered by creation date (newest first)
    const { data: updates, error } = await supabase
      .from(UPDATES_API_CONFIG.table)
      .select('*')
      .order(UPDATES_API_CONFIG.query.orderBy, { 
        ascending: UPDATES_API_CONFIG.query.orderDirection === 'asc' 
      })

    if (error) {
      return NextResponse.json({ 
        error: UPDATES_API_CONFIG.errors.failedToFetch 
      }, { status: UPDATES_API_CONFIG.status.internalError })
    }

    return NextResponse.json({ updates: updates || [] })

  } catch (error) {
    console.error('Updates API error:', error)
    return NextResponse.json({ 
      error: UPDATES_API_CONFIG.errors.internalError,
      details: error.message 
    }, { status: UPDATES_API_CONFIG.status.internalError })
  }
}
