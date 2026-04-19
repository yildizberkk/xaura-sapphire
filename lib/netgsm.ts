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
