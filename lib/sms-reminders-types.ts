/** Status state machine for public.message_sends.status. */
export type MessageSendStatus =
  | 'pending'
  | 'sending'
  | 'published'
  | 'publish_rejected'
  | 'delivered'
  | 'failed'
  | 'retry_published'
  | 'skipped_too_late'
  | 'canceled'

export interface ScheduledMessageRow {
  id: string
  day_idx: number
  session_idx: number
  session_title: string
  session_start_at: string // ISO
  reminder_at: string      // ISO
  message_body: string
  created_at: string
}

export interface MessageSendRow {
  id: string
  scheduled_message_id: string
  registration_id: string | null
  phone_snapshot: string
  status: MessageSendStatus
  netgsm_jobid: string | null
  netgsm_return_code: string | null
  published_at: string | null
  delivered_at: string | null
  retry_count: number
  last_error: string | null
  last_checked_at: string | null
  alerted_at: string | null
  created_at: string
}

export type PublishScope =
  | { kind: 'all' }
  | { kind: 'registration'; registrationId: string }
  | { kind: 'session'; dayIdx: number; sessionIdx: number }

export interface PublishSummary {
  scheduledMessagesInserted: number
  messageSendsInserted: number
  published: number
  publishRejected: number
  skippedTooLate: number
}

/** Safety cutoff — we never hand Netgsm a reminder less than this far in the future. */
export const PUBLISH_CUTOFF_MS = 2 * 60_000
