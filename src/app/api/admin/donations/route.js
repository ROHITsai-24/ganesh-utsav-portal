import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { DONATION_TABLE } from '@/lib/donation'

// Admin donation records: list them for the Admin panel table and delete a
// record when needed.

const ADMIN_DONATIONS_CONFIG = {
  errors: {
    donationIdRequired: 'Donation ID required',
    failedToLoad: 'Failed to load donations',
    failedToDelete: 'Failed to delete donation',
    internalError: 'Internal server error'
  },
  success: {
    deleted: 'Donation deleted successfully'
  },
  status: {
    badRequest: 400,
    internalError: 500
  }
}

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function GET(request) {
  try {
    const authResult = verifyAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { data, error } = await supabase
      .from(DONATION_TABLE)
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Donations fetch error:', error)
      return NextResponse.json(
        { error: ADMIN_DONATIONS_CONFIG.errors.failedToLoad },
        { status: ADMIN_DONATIONS_CONFIG.status.internalError }
      )
    }

    return NextResponse.json({ donations: data || [], total: data?.length || 0 })
  } catch (error) {
    console.error('Admin donations error:', error)
    return NextResponse.json(
      { error: ADMIN_DONATIONS_CONFIG.errors.internalError },
      { status: ADMIN_DONATIONS_CONFIG.status.internalError }
    )
  }
}

export async function DELETE(request) {
  try {
    const authResult = verifyAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const { id } = await request.json()
    if (!id) {
      return NextResponse.json(
        { error: ADMIN_DONATIONS_CONFIG.errors.donationIdRequired },
        { status: ADMIN_DONATIONS_CONFIG.status.badRequest }
      )
    }

    const { error } = await supabase.from(DONATION_TABLE).delete().eq('id', id)

    if (error) {
      console.error('Donation delete error:', error)
      return NextResponse.json(
        { error: ADMIN_DONATIONS_CONFIG.errors.failedToDelete },
        { status: ADMIN_DONATIONS_CONFIG.status.internalError }
      )
    }

    return NextResponse.json({ success: true, message: ADMIN_DONATIONS_CONFIG.success.deleted })
  } catch (error) {
    console.error('Admin donation delete error:', error)
    return NextResponse.json(
      { error: ADMIN_DONATIONS_CONFIG.errors.internalError },
      { status: ADMIN_DONATIONS_CONFIG.status.internalError }
    )
  }
}
