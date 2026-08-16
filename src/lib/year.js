// Per-year views of records that accumulate every festival.
//
// The year is derived from a record's created_at rather than stored in its own
// column: nothing needs migrating, existing rows keep the year they were
// actually created in, and Ganesh Chaturthi falls in August/September so a
// calendar year never splits a single festival.

export const YEAR_ALL = 'all'

/** Calendar year of a timestamp, or null when it cannot be parsed. */
export const yearOf = (value) => {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.getFullYear()
}

export const currentYear = () => new Date().getFullYear()

/**
 * Years present in the records, newest first. The current year is always
 * included even when nothing has been recorded yet, so at the start of a
 * festival the year is selectable and shows an empty state rather than
 * disappearing from the filter.
 */
export const availableYears = (records, field = 'created_at') => {
  const years = new Set([currentYear()])

  for (const record of records || []) {
    const year = yearOf(record?.[field])
    if (year) years.add(year)
  }

  return [...years].sort((a, b) => b - a)
}

/** True when the record belongs to the selected year (or the year is "all"). */
export const matchesYear = (record, year, field = 'created_at') =>
  year === YEAR_ALL || yearOf(record?.[field]) === year
