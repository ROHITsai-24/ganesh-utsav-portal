'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  DONATION_OPTIONS,
  DONATION_OPTION_LABELS,
  formatAmount,
  formatPhone,
  normalizePhone
} from '@/lib/donation'
import { availableYears, currentYear, matchesYear, YEAR_ALL } from '@/lib/year'
import YearFilter from './YearFilter'

const DONATIONS_MANAGER_CONFIG = {
  api: {
    donations: '/api/admin/donations',
    deleteAll: '/api/admin/donations/delete-all',
    export: '/api/admin/donations/export'
  },
  // The server rejects a delete-all without this exact token.
  deleteAllToken: 'DELETE_ALL_DONATIONS',
  table: {
    headers: [
      '#',
      'Submitted',
      'Donation Option',
      'Name',
      'Phone Number',
      'Amount',
      'Payment Date',
      'Sheet',
      'Actions'
    ],
    emptyMessage: 'No donations submitted yet'
  },
  messages: {
    failedToLoad: 'Failed to load donations',
    failedToDelete: 'Failed to delete donation',
    failedToDeleteAll: 'Failed to delete all donations',
    failedToExport: 'Failed to export donations',
    confirmDelete: 'Are you sure you want to delete this donation record? This cannot be undone.'
  }
}

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: DONATION_OPTIONS.alreadyPaid, label: DONATION_OPTION_LABELS[DONATION_OPTIONS.alreadyPaid] },
  { key: DONATION_OPTIONS.planningToPay, label: DONATION_OPTION_LABELS[DONATION_OPTIONS.planningToPay] }
]

const StatCard = ({ label, value, sublabel, accent }) => (
  <div className={`rounded-lg border p-4 ${accent}`}>
    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</p>
    <p className="mt-1 text-xl font-bold text-gray-900 sm:text-2xl">{value}</p>
    {sublabel && <p className="mt-0.5 text-xs text-gray-500">{sublabel}</p>}
  </div>
)

const OptionBadge = ({ status }) => {
  const isAlreadyPaid = status === DONATION_OPTIONS.alreadyPaid
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-1 text-xs font-medium ${
        isAlreadyPaid ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'
      }`}
    >
      {DONATION_OPTION_LABELS[status] || status}
    </span>
  )
}

export default function DonationsManager({ adminEmail }) {
  const [donations, setDonations] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [deletingAll, setDeletingAll] = useState(false)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  // Opens on this year's donations; earlier festivals stay one click away.
  const [year, setYear] = useState(currentYear())

  const loadDonations = useCallback(async () => {
    if (!adminEmail) return

    try {
      setLoading(true)
      setError('')

      const response = await fetch(`${DONATIONS_MANAGER_CONFIG.api.donations}?t=${Date.now()}`, {
        headers: { 'x-admin-email': adminEmail }
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error || DONATIONS_MANAGER_CONFIG.messages.failedToLoad)
      }

      const payload = await response.json()
      setDonations(payload.donations || [])
    } catch (loadError) {
      console.error('Load donations error:', loadError)
      setError(loadError?.message || DONATIONS_MANAGER_CONFIG.messages.failedToLoad)
    } finally {
      setLoading(false)
    }
  }, [adminEmail])

  useEffect(() => {
    loadDonations()
  }, [loadDonations])

  const handleDelete = useCallback(
    async (id) => {
      if (!window.confirm(DONATIONS_MANAGER_CONFIG.messages.confirmDelete)) return

      try {
        const response = await fetch(DONATIONS_MANAGER_CONFIG.api.donations, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'x-admin-email': adminEmail
          },
          body: JSON.stringify({ id })
        })

        if (!response.ok) {
          const body = await response.json().catch(() => ({}))
          throw new Error(body?.error || DONATIONS_MANAGER_CONFIG.messages.failedToDelete)
        }

        await loadDonations()
      } catch (deleteError) {
        console.error('Delete donation error:', deleteError)
        setError(deleteError?.message || DONATIONS_MANAGER_CONFIG.messages.failedToDelete)
      }
    },
    [adminEmail, loadDonations]
  )

  const handleDeleteAll = useCallback(async () => {
    // Two steps, matching the other destructive actions in the dashboard: an
    // initial confirm, then typing the word, so this cannot happen on a misclick.
    const warning =
      `⚠️ DANGER: This permanently deletes ALL ${donations.length} donation record` +
      `${donations.length === 1 ? '' : 's'}, across EVERY year - not just the year currently ` +
      'shown.\n\nRows already written to the Google Sheet are NOT removed - delete those in the ' +
      'Sheet itself.\n\nThis action CANNOT be undone.'

    if (!window.confirm(warning)) return
    if (window.prompt('Type "delete" to confirm:') !== 'delete') return

    try {
      setDeletingAll(true)
      setError('')

      const response = await fetch(DONATIONS_MANAGER_CONFIG.api.deleteAll, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': adminEmail
        },
        body: JSON.stringify({ confirm: DONATIONS_MANAGER_CONFIG.deleteAllToken })
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error || DONATIONS_MANAGER_CONFIG.messages.failedToDeleteAll)
      }

      await loadDonations()
    } catch (deleteAllError) {
      console.error('Delete all donations error:', deleteAllError)
      setError(deleteAllError?.message || DONATIONS_MANAGER_CONFIG.messages.failedToDeleteAll)
    } finally {
      setDeletingAll(false)
    }
  }, [adminEmail, donations.length, loadDonations])

  const handleExportCsv = useCallback(async () => {
    try {
      setExporting(true)
      setError('')

      // Fetched rather than linked so the admin header travels with the request.
      // Exports the year currently on screen, not silently everything.
      const query = year === YEAR_ALL ? '' : `?year=${year}`
      const response = await fetch(`${DONATIONS_MANAGER_CONFIG.api.export}${query}`, {
        headers: { 'x-admin-email': adminEmail }
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error || DONATIONS_MANAGER_CONFIG.messages.failedToExport)
      }

      const blob = await response.blob()
      const objectUrl = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = objectUrl
      link.download = `donations-${year === YEAR_ALL ? 'all' : year}-${new Date().toISOString().slice(0, 10)}.csv`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(objectUrl)
    } catch (exportError) {
      console.error('Export donations error:', exportError)
      setError(exportError?.message || DONATIONS_MANAGER_CONFIG.messages.failedToExport)
    } finally {
      setExporting(false)
    }
  }, [adminEmail, year])

  const years = useMemo(() => availableYears(donations), [donations])

  // Everything below the year filter - totals, table, export - describes the
  // selected year only.
  const yearDonations = useMemo(
    () => donations.filter((donation) => matchesYear(donation, year)),
    [donations, year]
  )

  const stats = useMemo(() => {
    const sumFor = (status) =>
      yearDonations
        .filter((donation) => donation.status === status)
        .reduce((total, donation) => total + Number(donation.amount || 0), 0)

    return {
      total: yearDonations.length,
      alreadyPaidCount: yearDonations.filter((d) => d.status === DONATION_OPTIONS.alreadyPaid).length,
      alreadyPaidAmount: sumFor(DONATION_OPTIONS.alreadyPaid),
      planningCount: yearDonations.filter((d) => d.status === DONATION_OPTIONS.planningToPay).length,
      planningAmount: sumFor(DONATION_OPTIONS.planningToPay)
    }
  }, [yearDonations])

  const visibleDonations = useMemo(() => {
    const term = search.trim().toLowerCase()
    const digits = normalizePhone(search)

    return yearDonations.filter((donation) => {
      if (filter !== 'all' && donation.status !== filter) return false
      if (!term) return true

      return (
        donation.name?.toLowerCase().includes(term) ||
        (digits.length > 0 && donation.phone?.includes(digits)) ||
        String(donation.amount).includes(term)
      )
    })
  }, [yearDonations, search, filter])

  const yearLabel = year === YEAR_ALL ? 'all years' : year

  return (
    <div className="space-y-5">
      {error && (
        <div className="flex items-center justify-between rounded-md border border-red-200 bg-red-50 p-3 text-red-700">
          <span className="text-sm">{error}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDonations}
            className="ml-2 border-red-300 bg-red-100 hover:bg-red-200"
          >
            Retry
          </Button>
        </div>
      )}

      <YearFilter years={years} value={year} onChange={setYear} />

      {/* Summary */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <StatCard
          label="Total Submissions"
          value={stats.total}
          sublabel={`Both donation options • ${yearLabel}`}
          accent="border-gray-200 bg-white"
        />
        <StatCard
          label="Already Paid"
          value={formatAmount(stats.alreadyPaidAmount)}
          sublabel={`${stats.alreadyPaidCount} donation${stats.alreadyPaidCount === 1 ? '' : 's'}`}
          accent="border-green-200 bg-green-50"
        />
        <StatCard
          label="Planning to Pay"
          value={formatAmount(stats.planningAmount)}
          sublabel={`${stats.planningCount} donation${stats.planningCount === 1 ? '' : 's'}`}
          accent="border-amber-200 bg-amber-50"
        />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((option) => (
            <button
              key={option.key}
              onClick={() => setFilter(option.key)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === option.key
                  ? 'bg-gray-900 text-white'
                  : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search by name, phone or amount..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full rounded-md border border-gray-300 px-3 py-2 pr-8 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex gap-2">
            <Button variant="outline" onClick={loadDonations} className="text-sm">
              Refresh
            </Button>
            <Button
              onClick={handleExportCsv}
              disabled={exporting || yearDonations.length === 0}
              className="bg-green-600 text-sm text-white hover:bg-green-700"
            >
              {exporting ? 'Exporting...' : '⬇ Export CSV'}
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAll}
              disabled={deletingAll || donations.length === 0}
              className="bg-red-700 text-sm text-white hover:bg-red-800"
              title="Delete every donation record"
            >
              {deletingAll ? 'Deleting...' : '🗑️ Delete All'}
            </Button>
          </div>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="py-10 text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          <p className="mt-3 text-sm text-gray-600">Loading donations...</p>
        </div>
      ) : (
        <div className="admin-table-scrollbar max-h-[30rem] overflow-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="sticky top-0 bg-gray-50">
              <tr className="border-b">
                {DONATIONS_MANAGER_CONFIG.table.headers.map((header) => (
                  <th key={header} className="whitespace-nowrap px-3 py-2 font-medium text-gray-700">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visibleDonations.length === 0 ? (
                <tr>
                  <td
                    colSpan={DONATIONS_MANAGER_CONFIG.table.headers.length}
                    className="py-6 text-center text-gray-500"
                  >
                    {search || filter !== 'all'
                      ? 'No donations match this search'
                      : `${DONATIONS_MANAGER_CONFIG.table.emptyMessage} for ${yearLabel}`}
                  </td>
                </tr>
              ) : (
                visibleDonations.map((donation, index) => (
                  <tr key={donation.id} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 font-semibold text-gray-600">{index + 1}</td>
                    <td className="whitespace-nowrap px-3 py-2 text-xs text-gray-600">
                      {donation.created_at ? new Date(donation.created_at).toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <OptionBadge status={donation.status} />
                    </td>
                    <td className="max-w-[12rem] truncate px-3 py-2" title={donation.name}>
                      {donation.name}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-mono text-xs">
                      {formatPhone(donation.phone)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 font-semibold">
                      {formatAmount(donation.amount)}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2">{donation.payment_date || '-'}</td>
                    <td className="px-3 py-2">
                      <span
                        title={
                          donation.synced_to_sheet
                            ? 'Synced to Google Sheet'
                            : 'Not synced to Google Sheet — export CSV to reconcile'
                        }
                      >
                        {donation.synced_to_sheet ? '✅' : '⚠️'}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(donation.id)}
                        className="bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700"
                      >
                        🗑️ Delete
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && (search || filter !== 'all') && (
        <p className="text-sm text-gray-600">
          Showing {visibleDonations.length} of {donations.length} donation
          {donations.length === 1 ? '' : 's'}
        </p>
      )}
    </div>
  )
}
