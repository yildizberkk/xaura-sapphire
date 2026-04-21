import { parsePhoneNumberFromString, type CountryCode } from 'libphonenumber-js'

export interface NormalizedPhone {
  /** E.164 format — always starts with '+' (e.g. "+905387236059"). */
  e164: string
  /** National format without country code, digits only (e.g. "5387236059" — what Netgsm expects for TR). */
  national: string
  /** ISO 3166-1 alpha-2 (e.g. "TR"). Undefined if parser couldn't infer. */
  country?: CountryCode
}

/**
 * Parse any human-entered phone string to a canonical form.
 * Accepts "+905...", "05...", "5...", "+90 538 723 60 59", "(0538) 723-6059", etc.
 * Defaults to Turkey when no country code is present — our audience is predominantly TR.
 */
export function normalizePhone(raw: string, defaultCountry: CountryCode = 'TR'): NormalizedPhone | null {
  const parsed = parsePhoneNumberFromString(raw, defaultCountry)
  if (!parsed || !parsed.isValid()) return null

  return {
    e164: parsed.number,
    national: parsed.nationalNumber,
    country: parsed.country,
  }
}
