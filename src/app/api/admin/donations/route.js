import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { DONATION_STORAGE_BUCKET, DONATION_TABLE, storagePathFromPublicUrl } from '@/lib/donation'

// Admin donation records: list them for the Admin panel table and delete a
// record (with its Payment Screenshot) when needed.

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

    const { data: existing } = await supabase
      .from(DONATION_TABLE)
      .select('screenshot_url')
      .eq('id', id)
      .maybeSingle()

    const { error } = await supabase.from(DONATION_TABLE).delete().eq('id', id)

    if (error) {
      console.error('Donation delete error:', error)
      return NextResponse.json(
        { error: ADMIN_DONATIONS_CONFIG.errors.failedToDelete },
        { status: ADMIN_DONATIONS_CONFIG.status.internalError }
      )
    }

    // Best-effort cleanup: an orphaned screenshot must not fail the delete.
    const objectPath = storagePathFromPublicUrl(existing?.screenshot_url)
    if (objectPath) {
      const { error: storageError } = await supabase.storage
        .from(DONATION_STORAGE_BUCKET)
        .remove([objectPath])
      if (storageError) {
        console.error('Donation screenshot cleanup error:', storageError)
      }
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
