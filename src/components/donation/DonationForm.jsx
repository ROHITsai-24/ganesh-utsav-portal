'use client'

import { useCallback, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  DONATION_LIMITS,
  DONATION_OPTIONS,
  formatAmount,
  todayISODate,
  validateDonation,
  validateScreenshot
} from '@/lib/donation'

const EMPTY_FORM = {
  donationOption: DONATION_OPTIONS.alreadyPaid,
  name: '',
  phone: '',
  amount: '',
  paymentDate: ''
}

// Small building blocks -------------------------------------------------------

const FieldError = ({ id, message }) =>
  message ? (
    <p id={id} className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600">
      <svg className="mt-0.5 h-4 w-4 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path
          fillRule="evenodd"
          d="M10 18a8 8 0 100-16 8 8 0 000 16zM9 9a1 1 0 012 0v4a1 1 0 11-2 0V9zm1-5a1.25 1.25 0 100 2.5A1.25 1.25 0 0010 4z"
          clipRule="evenodd"
        />
      </svg>
      <span>{message}</span>
    </p>
  ) : null

const FormField = ({ id, label, badge, error, hint, children }) => (
  <div>
    <div className="mb-1.5 flex items-center justify-between gap-2">
      <Label htmlFor={id} className="text-sm font-semibold text-gray-800">
        {label}
      </Label>
      {badge && (
        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-medium text-gray-500">
          {badge}
        </span>
      )}
    </div>
    {children}
    {hint && !error && <p className="mt-1.5 text-xs text-gray-500">{hint}</p>}
    <FieldError id={`${id}-error`} message={error} />
  </div>
)

/** One of the two donation options, rendered as a large selectable card. */
const DonationOptionCard = ({ value, title, hint, icon, selected, onSelect }) => (
  <label
    className={`relative flex cursor-pointer items-start gap-3 rounded-2xl border-2 p-4 transition-all duration-200 ${
      selected
        ? 'border-[#8B4513] bg-[#8B4513]/5 shadow-md'
        : 'border-gray-200 bg-white hover:border-[#8B4513]/40 hover:bg-gray-50'
    }`}
  >
    <input
      type="radio"
      name="donationOption"
      value={value}
      checked={selected}
      onChange={() => onSelect(value)}
      className="sr-only"
    />
    <span
      className={`mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
        selected ? 'border-[#8B4513] bg-[#8B4513]' : 'border-gray-300 bg-white'
      }`}
      aria-hidden="true"
    >
      {selected && <span className="h-2 w-2 rounded-full bg-white" />}
    </span>
    <span className="min-w-0">
      <span className="flex items-center gap-2 text-base font-semibold text-gray-900">
        <span aria-hidden="true">{icon}</span>
        {title}
      </span>
      <span className="mt-0.5 block text-sm leading-snug text-gray-600">{hint}</span>
    </span>
  </label>
)

// Form ------------------------------------------------------------------------

export default function DonationForm() {
  const { translations } = useLanguage()
  const [formData, setFormData] = useState(EMPTY_FORM)
  const [screenshot, setScreenshot] = useState(null)
  const [screenshotPreview, setScreenshotPreview] = useState('')
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [submitted, setSubmitted] = useState(null)
  const fileInputRef = useRef(null)

  const isAlreadyPaid = formData.donationOption === DONATION_OPTIONS.alreadyPaid
  const today = useMemo(() => todayISODate(), [])

  /** Resolves a validation error key to the viewer's language. */
  const messageFor = useCallback(
    (key) => translations.donationErrors?.[key] || translations.donationGenericError,
    [translations]
  )

  const setField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev))
  }, [])

  const clearScreenshot = useCallback(() => {
    setScreenshot(null)
    setScreenshotPreview((previous) => {
      if (previous) URL.revokeObjectURL(previous)
      return ''
    })
    setErrors((prev) => ({ ...prev, screenshot: undefined }))
    if (fileInputRef.current) fileInputRef.current.value = ''
  }, [])

  const selectOption = useCallback(
    (option) => {
      setFormData((prev) => ({ ...prev, donationOption: option }))
      // The date rule flips between the two options, and a screenshot only
      // belongs to a completed payment — so drop both when switching.
      setErrors((prev) => ({ ...prev, donationOption: undefined, paymentDate: undefined }))
      if (option !== DONATION_OPTIONS.alreadyPaid) clearScreenshot()
    },
    [clearScreenshot]
  )

  const handleScreenshotChange = useCallback(
    (event) => {
      const file = event.target.files?.[0] || null
      const errorKey = validateScreenshot(file)

      // Replacing or rejecting a file always releases the previous preview URL.
      setScreenshotPreview((previous) => {
        if (previous) URL.revokeObjectURL(previous)
        return errorKey || !file ? '' : URL.createObjectURL(file)
      })

      if (errorKey) {
        setScreenshot(null)
        setErrors((prev) => ({ ...prev, screenshot: messageFor(errorKey) }))
        if (fileInputRef.current) fileInputRef.current.value = ''
        return
      }

      setScreenshot(file)
      setErrors((prev) => ({ ...prev, screenshot: undefined }))
    },
    [messageFor]
  )

  const handleSubmit = useCallback(
    async (event) => {
      event.preventDefault()
      setFormError('')

      const { valid, errors: validationErrors } = validateDonation(formData)
      const screenshotErrorKey = validateScreenshot(screenshot)

      if (!valid || screenshotErrorKey) {
        const resolved = Object.fromEntries(
          Object.entries(validationErrors).map(([field, key]) => [field, messageFor(key)])
        )
        if (screenshotErrorKey) resolved.screenshot = messageFor(screenshotErrorKey)
        setErrors(resolved)
        return
      }

      try {
        setSubmitting(true)

        const payload = new FormData()
        payload.append('donationOption', formData.donationOption)
        payload.append('name', formData.name.trim())
        payload.append('phone', formData.phone.trim())
        payload.append('amount', formData.amount)
        payload.append('paymentDate', formData.paymentDate)
        if (screenshot) payload.append('screenshot', screenshot)

        const response = await fetch('/api/donations', { method: 'POST', body: payload })
        const result = await response.json().catch(() => ({}))

        if (!response.ok) {
          // The server re-validates, so surface any field errors it sends back.
          if (result?.fieldErrors) setErrors(result.fieldErrors)
          setFormError(result?.error || translations.donationGenericError)
          return
        }

        setSubmitted({
          donationOption: formData.donationOption,
          name: formData.name.trim(),
          amount: Number(formData.amount),
          paymentDate: formData.paymentDate
        })
        setFormData(EMPTY_FORM)
        clearScreenshot()
        setErrors({})
      } catch (error) {
        console.error('Donation submission error:', error)
        setFormError(translations.donationGenericError)
      } finally {
        setSubmitting(false)
      }
    },
    [formData, screenshot, messageFor, translations, clearScreenshot]
  )

  // Success state -------------------------------------------------------------
  if (submitted) {
    const wasAlreadyPaid = submitted.donationOption === DONATION_OPTIONS.alreadyPaid

    return (
      <div className="flex h-full flex-col items-center justify-center rounded-3xl border border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-8 text-center">
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <svg className="h-9 w-9 text-green-600" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h3 className="mb-2 text-2xl font-bold text-gray-900">{translations.donationSuccessTitle}</h3>
        <p className="mb-6 max-w-sm text-gray-600">
          {wasAlreadyPaid ? translations.donationSuccessAlreadyPaid : translations.donationSuccessPlanning}
        </p>

        <dl className="mb-7 w-full max-w-sm space-y-2 rounded-2xl border border-green-200 bg-white/70 p-4 text-sm">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">{translations.donationOptionsLabel}</dt>
            <dd className="font-semibold text-gray-900">
              {wasAlreadyPaid ? translations.donationAlreadyPaid : translations.donationPlanningToPay}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">{translations.donationNameLabel}</dt>
            <dd className="truncate font-semibold text-gray-900">{submitted.name}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">
              {wasAlreadyPaid ? translations.donationAmountPaidLabel : translations.donationAmountPlannedLabel}
            </dt>
            <dd className="font-semibold text-gray-900">{formatAmount(submitted.amount)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-gray-500">
              {wasAlreadyPaid ? translations.donationPaymentDateLabel : translations.donationPlannedDateLabel}
            </dt>
            <dd className="font-semibold text-gray-900">{submitted.paymentDate}</dd>
          </div>
        </dl>

        <Button
          onClick={() => setSubmitted(null)}
          className="rounded-full bg-[#8B4513] px-8 py-3 text-white hover:bg-[#A0522D]"
        >
          {translations.donationSubmitAnother}
        </Button>
      </div>
    )
  }

  // Form state ----------------------------------------------------------------
  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="rounded-3xl border border-gray-200 bg-white p-6 shadow-xl md:p-8"
    >
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 md:text-2xl">{translations.donationFormTitle}</h3>
        <p className="mt-1 text-sm text-gray-600">{translations.donationFormDescription}</p>
      </div>

      {formError && (
        <div role="alert" className="mb-5 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {formError}
        </div>
      )}

      {/* Donation Option */}
      <fieldset className="mb-6">
        <legend className="mb-2.5 text-sm font-semibold text-gray-800">
          {translations.donationOptionsLabel}
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          <DonationOptionCard
            value={DONATION_OPTIONS.alreadyPaid}
            title={translations.donationAlreadyPaid}
            hint={translations.donationAlreadyPaidHint}
            icon="✅"
            selected={isAlreadyPaid}
            onSelect={selectOption}
          />
          <DonationOptionCard
            value={DONATION_OPTIONS.planningToPay}
            title={translations.donationPlanningToPay}
            hint={translations.donationPlanningToPayHint}
            icon="🗓️"
            selected={!isAlreadyPaid}
            onSelect={selectOption}
          />
        </div>
        <FieldError id="donationOption-error" message={errors.donationOption} />
      </fieldset>

      <div className="space-y-5">
        <FormField id="donation-name" label={translations.donationNameLabel} error={errors.name}>
          <Input
            id="donation-name"
            type="text"
            autoComplete="name"
            maxLength={DONATION_LIMITS.nameMax}
            placeholder={translations.donationNamePlaceholder}
            value={formData.name}
            onChange={(event) => setField('name', event.target.value)}
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'donation-name-error' : undefined}
            className={errors.name ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
        </FormField>

        <FormField id="donation-phone" label={translations.donationPhoneLabel} error={errors.phone}>
          <Input
            id="donation-phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel"
            maxLength={15}
            placeholder={translations.donationPhonePlaceholder}
            value={formData.phone}
            onChange={(event) => setField('phone', event.target.value)}
            aria-invalid={Boolean(errors.phone)}
            aria-describedby={errors.phone ? 'donation-phone-error' : undefined}
            className={errors.phone ? 'border-red-400 focus-visible:ring-red-400' : ''}
          />
        </FormField>

        <div className="grid gap-5 sm:grid-cols-2">
          {/* Label switches with the selected option: Paid vs Planned */}
          <FormField
            id="donation-amount"
            label={isAlreadyPaid ? translations.donationAmountPaidLabel : translations.donationAmountPlannedLabel}
            error={errors.amount}
          >
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-500">
                ₹
              </span>
              <Input
                id="donation-amount"
                type="number"
                inputMode="decimal"
                min={DONATION_LIMITS.amountMin}
                max={DONATION_LIMITS.amountMax}
                step="1"
                placeholder={translations.donationAmountPlaceholder}
                value={formData.amount}
                onChange={(event) => setField('amount', event.target.value)}
                aria-invalid={Boolean(errors.amount)}
                aria-describedby={errors.amount ? 'donation-amount-error' : undefined}
                className={`pl-7 ${errors.amount ? 'border-red-400 focus-visible:ring-red-400' : ''}`}
              />
            </div>
          </FormField>

          <FormField
            id="donation-date"
            label={isAlreadyPaid ? translations.donationPaymentDateLabel : translations.donationPlannedDateLabel}
            error={errors.paymentDate}
          >
            <Input
              id="donation-date"
              type="date"
              // Already Paid cannot be in the future; Planning to Pay cannot be in the past.
              max={isAlreadyPaid ? today : undefined}
              min={isAlreadyPaid ? undefined : today}
              value={formData.paymentDate}
              onChange={(event) => setField('paymentDate', event.target.value)}
              aria-invalid={Boolean(errors.paymentDate)}
              aria-describedby={errors.paymentDate ? 'donation-date-error' : undefined}
              className={errors.paymentDate ? 'border-red-400 focus-visible:ring-red-400' : ''}
            />
          </FormField>
        </div>

        {/* Payment Screenshot — Already Paid only */}
        {isAlreadyPaid && (
          <FormField
            id="donation-screenshot"
            label={translations.donationScreenshotLabel}
            badge={translations.donationOptionalTag}
            error={errors.screenshot}
            hint={translations.donationScreenshotHint}
          >
            <input
              ref={fileInputRef}
              id="donation-screenshot"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleScreenshotChange}
              className="sr-only"
            />

            {screenshot ? (
              <div className="flex items-center gap-3 rounded-md border border-gray-200 bg-gray-50 p-2.5">
                {screenshotPreview && (
                  <img
                    src={screenshotPreview}
                    alt={translations.donationScreenshotLabel}
                    className="h-12 w-12 flex-shrink-0 rounded object-cover"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-800">{screenshot.name}</p>
                  <p className="text-xs text-gray-500">{(screenshot.size / 1024).toFixed(0)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={clearScreenshot}
                  className="flex-shrink-0 rounded px-2 py-1 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  {translations.donationScreenshotRemove}
                </button>
              </div>
            ) : (
              <label
                htmlFor="donation-screenshot"
                className={`flex cursor-pointer items-center justify-center gap-2 rounded-md border-2 border-dashed px-4 py-4 text-sm font-medium transition-colors ${
                  errors.screenshot
                    ? 'border-red-400 text-red-600 hover:bg-red-50'
                    : 'border-gray-300 text-gray-600 hover:border-[#8B4513]/50 hover:bg-gray-50'
                }`}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 16.5V19a2 2 0 002 2h14a2 2 0 002-2v-2.5M12 3v13m0-13l-4 4m4-4l4 4"
                  />
                </svg>
                {translations.donationScreenshotChoose}
              </label>
            )}
          </FormField>
        )}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="mt-7 w-full rounded-full bg-[#8B4513] py-6 text-base font-semibold text-white shadow-lg transition-all hover:bg-[#A0522D] hover:shadow-xl disabled:opacity-70"
      >
        {submitting ? (
          <span className="flex items-center justify-center gap-2">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            {translations.donationSubmitting}
          </span>
        ) : (
          translations.donationSubmit
        )}
      </Button>
    </form>
  )
}
