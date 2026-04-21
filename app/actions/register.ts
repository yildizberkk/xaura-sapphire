'use server'
import { after } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { normalizePhone } from '@/lib/phone'
import { sendWelcomeSms } from '@/lib/netgsm'
import { buildWelcomeSms } from '@/lib/sms-templates'
import { publishPendingReminders } from '@/lib/sms-reminders-publish'
import type { Locale } from '@/lib/i18n'

class DuplicatePhoneError extends Error {
  constructor() {
    super('DUPLICATE_PHONE')
    this.name = 'DuplicatePhoneError'
  }
}

export interface RegistrationInput {
  firstName: string
  lastName:  string
  phone:     string
  email?:    string
  consent:   boolean
  locale:    Locale
}

export async function registerUser(data: RegistrationInput): Promise<void> {
  const normalized = normalizePhone(data.phone)

  let smsSuccessful: boolean | null = null
  let smsCode: string | null = null
  let smsJobid: string | null = null

  if (normalized) {
    const message = buildWelcomeSms(data.locale, data.firstName)
    const result = await sendWelcomeSms({
      phoneNational: normalized.national,
      message,
      turkishEncoding: data.locale === 'tr',
    })
    smsSuccessful = result.success
    smsCode = result.code
    smsJobid = result.jobid
  } else {
    smsSuccessful = false
    smsCode = 'INVALID_PHONE'
  }

  const { data: inserted, error } = await supabaseAdmin.from('registrations').insert({
    first_name:           data.firstName,
    last_name:            data.lastName,
    phone:                normalized?.e164 ?? data.phone,
    email:                data.email || null,
    consent:              data.consent,
    phone_country_code:   normalized?.country ?? null,
    sms_successful:       smsSuccessful,
    sms_api_return_code:  smsCode,
    sms_jobid:            smsJobid,
  }).select('id').single()
  if (error) {
    // Postgres unique_violation — phone already registered
    if ((error as { code?: string }).code === '23505') {
      throw new DuplicatePhoneError()
    }
    throw new Error(error.message)
  }

  // Run after the response is sent — don't make the user wait for 13 Netgsm calls
  after(async () => {
    try {
      await publishPendingReminders({ kind: 'registration', registrationId: inserted.id })
    } catch (err) {
      console.error('[register] inline reminder publish failed', err)
    }
  })
}
