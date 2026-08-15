import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { DONATION_STORAGE_BUCKET, DONATION_TABLE, storagePathFromPublicUrl } from '@/lib/donation'

// Deletes every donation record and its Payment Screenshot.
//
// This is irreversible and wipes the whole table, so it is a separate endpoint
// from the single-record delete and additionally requires an explicit
// confirmation token in the body. A malformed or accidental request cannot
// empty the table by omission.

const CONFIRMATION_TOKEN = 'DELETE_ALL_DONATIONS'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

export async function DELETE(request) {
  try {
    const authResult = verifyAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    const body = await request.json().catch(() => ({}))
    if (body?.confirm !== CONFIRMATION_TOKEN) {
      return NextResponse.json(
        { error: 'Confirmation required to delete all donations' },
        { status: 400 }
      )
    }

    // Collect the screenshots before the rows go, otherwise their paths are lost.
    const { data: existing, error: fetchError } = await supabase
      .from(DONATION_TABLE)
      .select('id, screenshot_url')

    if (fetchError) {
      console.error('Donations fetch before delete-all error:', fetchError)
      return NextResponse.json({ error: 'Failed to delete donations' }, { status: 500 })
    }

    if (!existing || existing.length === 0) {
      return NextResponse.json({ success: true, deletedCount: 0, message: 'No donations to delete' })
    }

    const { error: deleteError } = await supabase
      .from(DONATION_TABLE)
      .delete()
      .not('id', 'is', null)

    if (deleteError) {
      console.error('Donations delete-all error:', deleteError)
      return NextResponse.json({ error: 'Failed to delete donations' }, { status: 500 })
    }

    // Best-effort cleanup: orphaned screenshots must not fail an otherwise
    // successful delete.
    const objectPaths = existing
      .map((donation) => storagePathFromPublicUrl(donation.screenshot_url))
      .filter(Boolean)

    if (objectPaths.length > 0) {
      const { error: storageError } = await supabase.storage
        .from(DONATION_STORAGE_BUCKET)
        .remove(objectPaths)
      if (storageError) {
        console.error('Donation screenshots cleanup error:', storageError)
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount: existing.length,
      message: `Successfully deleted ${existing.length} donation${existing.length === 1 ? '' : 's'}`
    })
  } catch (error) {
    console.error('Delete all donations error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
