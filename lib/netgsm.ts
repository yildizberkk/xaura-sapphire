const NETGSM_SEND_URL = 'https://api.netgsm.com.tr/sms/rest/v2/send'

interface SendWelcomeSmsParams {
  /** National number, digits only — e.g. "5387236059". */
  phoneNational: string
  /** Message body (pre-interpolated). */
  message: string
  /** true for the TR template; enables GSM-7 Turkish shift table to save segments. */
  turkishEncoding: boolean
}

export interface SendSmsResult {
  success: boolean
  /** Netgsm code ("00" on success, "40"/"50"/... on business error) or a synthetic code on network/HTTP failure. */
  code: string
  /** Netgsm jobid — present when Netgsm accepted the request (code "00"). Use it to query the Netgsm delivery report for actual handset delivery. */
  jobid: string | null
}

export async function sendWelcomeSms({
  phoneNational,
  message,
  turkishEncoding,
}: SendWelcomeSmsParams): Promise<SendSmsResult> {
  const username = process.env.NETGSM_USERNAME
  const password = process.env.NETGSM_PASSWORD
  const msgheader = process.env.NETGSM_MSGHEADER
  const appname = process.env.NETGSM_APPNAME

  if (!username || !password || !msgheader) {
    return { success: false, code: 'MISSING_CREDENTIALS', jobid: null }
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  const body: Record<string, unknown> = {
    msgheader,
    messages: [{ msg: message, no: phoneNational }],
    iysfilter: '0',
  }
  if (turkishEncoding) body.encoding = 'tr'
  if (appname) body.appname = appname

  try {
    const res = await fetch(NETGSM_SEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })

    // Netgsm returns HTTP 406 with a JSON body containing the business error code.
    const json = (await res.json().catch(() => null)) as { code?: string; jobid?: string } | null
    const code = json?.code ?? `HTTP_${res.status}`
    const success = res.ok && code === '00'

    return { success, code, jobid: success ? (json?.jobid ?? null) : null }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    return { success: false, code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR', jobid: null }
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Reminder SMS API — scheduled send, immediate send, cancel, delivery report
// ─────────────────────────────────────────────────────────────────────────

const NETGSM_CANCEL_URL = 'https://api.netgsm.com.tr/sms/rest/v2/cancel'
const NETGSM_REPORT_URL = 'https://api.netgsm.com.tr/sms/rest/v2/report'

interface SendReminderParams {
  phoneNational: string
  message: string
  /** Pass only for scheduled sends. Format: `ddMMyyyyHHmm` (Istanbul wall-clock). */
  startdate?: string
}

async function sendReminder({
  phoneNational,
  message,
  startdate,
}: SendReminderParams): Promise<SendSmsResult> {
  const username  = process.env.NETGSM_USERNAME
  const password  = process.env.NETGSM_PASSWORD
  const msgheader = process.env.NETGSM_MSGHEADER
  const appname   = process.env.NETGSM_APPNAME

  if (!username || !password || !msgheader) {
    return { success: false, code: 'MISSING_CREDENTIALS', jobid: null }
  }

  const auth = Buffer.from(`${username}:${password}`).toString('base64')
  const body: Record<string, unknown> = {
    msgheader,
    messages: [{ msg: message, no: phoneNational }],
    iysfilter: '0',
    encoding: 'tr',
  }
  if (appname) body.appname = appname
  if (startdate) body.startdate = startdate

  try {
    const res = await fetch(NETGSM_SEND_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(15_000),
    })
    const json = (await res.json().catch(() => null)) as
      { code?: string; jobid?: string } | null
    const code = json?.code ?? `HTTP_${res.status}`
    const success = res.ok && code === '00'
    return { success, code, jobid: success ? (json?.jobid ?? null) : null }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    return {
      success: false,
      code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR',
      jobid: null,
    }
  }
}

export function sendScheduledSms(p: {
  phoneNational: string
  message: string
  startdate: string
}): Promise<SendSmsResult> {
  return sendReminder(p)
}

export function sendImmediateSms(p: {
  phoneNational: string
  message: string
}): Promise<SendSmsResult> {
  return sendReminder({ ...p, startdate: undefined })
}

export interface CancelSmsResult {
  success: boolean
  code: string
}

export async function cancelScheduledSms(jobid: string): Promise<CancelSmsResult> {
  const username = process.env.NETGSM_USERNAME
  const password = process.env.NETGSM_PASSWORD
  if (!username || !password) return { success: false, code: 'MISSING_CREDENTIALS' }
  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const res = await fetch(NETGSM_CANCEL_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ jobid }),
      signal: AbortSignal.timeout(15_000),
    })
    const json = (await res.json().catch(() => null)) as { code?: string } | null
    const code = json?.code ?? `HTTP_${res.status}`
    return { success: res.ok && code === '00', code }
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === 'TimeoutError'
    return { success: false, code: isTimeout ? 'TIMEOUT' : 'NETWORK_ERROR' }
  }
}

export type DeliveryStatus = 'delivered' | 'failed' | 'pending' | 'unknown'

export interface DeliveryReportEntry {
  jobid: string
  status: DeliveryStatus
  /** Raw Netgsm delivery status string for diagnostic logging. */
  raw?: string
}

export async function getDeliveryReport(
  jobids: string[],
): Promise<DeliveryReportEntry[]> {
  if (jobids.length === 0) return []
  const username = process.env.NETGSM_USERNAME
  const password = process.env.NETGSM_PASSWORD
  if (!username || !password) {
    return jobids.map(jobid => ({ jobid, status: 'unknown', raw: 'MISSING_CREDENTIALS' }))
  }
  const auth = Buffer.from(`${username}:${password}`).toString('base64')

  try {
    const res = await fetch(NETGSM_REPORT_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify({ jobids }),
      signal: AbortSignal.timeout(15_000),
    })
    const json = (await res.json().catch(() => null)) as
      | { reports?: Array<{ jobid: string; status?: string; deliveryStatus?: string }> }
      | null
    const reports = json?.reports ?? []
    return jobids.map(jobid => {
      const r = reports.find(x => x.jobid === jobid)
      const raw = r?.deliveryStatus ?? r?.status ?? ''
      return { jobid, status: classifyDelivery(raw), raw }
    })
  } catch {
    return jobids.map(jobid => ({ jobid, status: 'unknown' as const, raw: 'NETWORK_ERROR' }))
  }
}

function classifyDelivery(raw: string): DeliveryStatus {
  const s = raw.toUpperCase()
  if (['DELIVERED', 'OK', '1', 'SUCCESS'].some(k => s.includes(k))) return 'delivered'
  if (['FAILED', 'ERROR', 'REJECTED', 'UNDELIVERED'].some(k => s.includes(k))) return 'failed'
  if (['WAITING', 'PENDING', 'QUEUED', 'SCHEDULED'].some(k => s.includes(k))) return 'pending'
  return 'unknown'
}
