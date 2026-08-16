import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { verifyAdminAuth } from '@/lib/admin-auth'
import { DONATION_OPTION_LABELS, DONATION_TABLE, formatPhone } from '@/lib/donation'

// Exports every donation record as a CSV file for the Admin panel.

const CSV_HEADERS = [
  'Submitted At',
  'Donation Option',
  'Name',
  'Phone Number',
  'Amount',
  'Payment Date',
  'Synced to Google Sheet',
  'Record ID'
]

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

/** Escapes a value for CSV: wraps in quotes and doubles any inner quote. */
const toCsvCell = (value) => {
  if (value === null || value === undefined) return '""'
  return `"${String(value).replace(/"/g, '""')}"`
}

const toCsv = (donations) => {
  const rows = donations.map((donation) =>
    [
      donation.created_at ? new Date(donation.created_at).toISOString() : '',
      DONATION_OPTION_LABELS[donation.status] || donation.status,
      donation.name,
      formatPhone(donation.phone),
      donation.amount,
      donation.payment_date,
      donation.synced_to_sheet ? 'Yes' : 'No',
      donation.id
    ].map(toCsvCell).join(',')
  )

  // The BOM makes Excel read the file as UTF-8 so Telugu names stay intact.
  return `﻿${[CSV_HEADERS.map(toCsvCell).join(','), ...rows].join('\r\n')}`
}

export async function GET(request) {
  try {
    const authResult = verifyAdminAuth(request)
    if (authResult.error) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status })
    }

    // Optional ?year=2026 so the export matches the year on screen in the
    // admin panel. Omitted means every year.
    const yearParam = new URL(request.url).searchParams.get('year')
    const year = /^\d{4}$/.test(yearParam || '') ? Number(yearParam) : null

    let query = supabase.from(DONATION_TABLE).select('*')

    if (year) {
      query = query
        .gte('created_at', `${year}-01-01T00:00:00.000Z`)
        .lt('created_at', `${year + 1}-01-01T00:00:00.000Z`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) {
      console.error('Donations export error:', error)
      return NextResponse.json({ error: 'Failed to export donations' }, { status: 500 })
    }

    const filename = `donations-${year || 'all'}-${new Date().toISOString().slice(0, 10)}.csv`

    return new NextResponse(toCsv(data || []), {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Cache-Control': 'no-store'
      }
    })
  } catch (error) {
    console.error('Admin donations export error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
