# SMS Reminder System Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Send every registrant an SMS 10 minutes before every content session (13 sessions across 3 days), using Netgsm's native scheduled-send, with a 5-minute watchdog cron for new-registration catch-up, delivery reconciliation, single-retry on failure, and Telegram alerts.

**Architecture:** Hybrid — Netgsm owns delivery timing via `startdate="ddMMyyyyHHmm"`; we pre-publish the full per-user × per-session plan, persist every `jobid`, and run a 5-minute Vercel cron that (a) publishes gaps from new registrations, (b) reconciles delivery reports, (c) retries failures once, (d) alerts on terminal failures. Europe/Istanbul TZ is anchored explicitly in a server-side helper.

**Tech Stack:** Next.js 16 (App Router), TypeScript, React 19, Supabase JS (service role), libphonenumber-js, Netgsm REST API v2, Vercel Cron, Telegram Bot API, vitest (new, for pure-logic tests).

**Spec:** `docs/superpowers/specs/2026-04-19-sms-reminder-system-design.md`

---

## File Structure

### New files (18)

| Path | Responsibility |
|---|---|
| `vitest.config.ts` | Test runner config. |
| `lib/schedule-time.ts` | Istanbul-anchored date helpers: `sessionStartUtc`, `reminderAtUtc`, `formatNetgsmStartdate`. |
| `lib/schedule-time.test.ts` | Unit tests (critical — TZ math). |
| `lib/sms-reminders-types.ts` | Status enum, shared types. |
| `lib/sms-reminders-template.ts` | `resolveMessage`, `validateTemplateLength` — pure. |
| `lib/sms-reminders-template.test.ts` | Unit tests for template resolution + length guard. |
| `lib/sms-reminders-publish.ts` | `publishPendingReminders` core (DB + Netgsm calls). |
| `lib/sms-reminders-reconcile.ts` | Delivery-report polling + single-retry logic. |
| `lib/schedule-loader.ts` | Thin wrapper: load `schedule.json` or `schedule.dev.json` based on `USE_DEV_SCHEDULE` env. |
| `lib/telegram.ts` | `alertOps(severity, summary, details)`. |
| `lib/admin-auth.ts` | `requireAdminAuth(request)` — bearer token check. |
| `lib/event-clock.ts` | Dev-only `useEventClock` React hook. |
| `schedule.dev.json` | 3-session dev schedule for Layer-3 staging runs. |
| `app/api/cron/sms-watchdog/route.ts` | 5-minute watchdog endpoint. |
| `app/api/admin/sms/status/route.ts` | Per-session status JSON. |
| `app/api/admin/sms/publish-all/route.ts` | Manual publish trigger. |
| `app/api/admin/sms/cancel/route.ts` | Cancel one session's sends. |
| `app/api/admin/sms/resend/route.ts` | Immediate-send one row. |
| `app/api/admin/sms/killswitch/route.ts` | Toggle killswitch in `sms_config`. |
| `app/api/admin/sms/preflight/route.ts` | Layer-4 TZ verification send. |
| `app/admin/sms/page.tsx` | Status page (server component). |
| `vercel.ts` | Cron configuration. |

### Modified files (5)

| Path | Change |
|---|---|
| `package.json` | Add `vitest`, `@types/node` (if missing), add `test`/`test:watch` scripts. |
| `.gitignore` | Ignore `registrations_test_backup.json`. |
| `schedule.json` | Add `event.timezone`, add `smsReminder: false` to "Giriş" + "Kapı Açılış". |
| `lib/schedule.ts` | Extend types: `RawSession.smsReminder?`, `RawSession.smsMessage?`, `ScheduleData.event.timezone`. |
| `lib/netgsm.ts` | Add `sendScheduledSms`, `sendImmediateSms`, `cancelScheduledSms`, `getDeliveryReport`. |
| `app/actions/register.ts` | Call `publishPendingReminders({ registrationId })` after welcome SMS. |
| `app/client-page.tsx` | Replace top-level `new Date()` with `useEventClock()`. |

### Supabase migrations (3)

| Migration | Table |
|---|---|
| `create_scheduled_messages` | `public.scheduled_messages` |
| `create_message_sends` | `public.message_sends` |
| `create_sms_config` | `public.sms_config` (single-row) |

---

## Task 1: Add vitest for pure-logic tests

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install vitest**

Run: `npm install -D vitest`

Expected: vitest added to `devDependencies`.

- [ ] **Step 2: Add test scripts to `package.json`**

In the `"scripts"` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 3: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    include: ['lib/**/*.test.ts'],
    environment: 'node',
  },
})
```

- [ ] **Step 4: Verify empty test run works**

Run: `npm test`
Expected: exits 0 with "No test files found" (or similar).

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add vitest for pure-logic unit tests"
```

---

## Task 2: Update `.gitignore` for test-data backup

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Append backup pattern**

Append to `.gitignore`:

```
# local test-data backup before go-live
registrations_test_backup.json
```

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: ignore local test-data backup file"
```

---

## Task 3: Add `event.timezone` and `smsReminder` flags to `schedule.json`

**Files:**
- Modify: `schedule.json`

- [ ] **Step 1: Add `timezone` to the top-level `event` object**

Change:

```jsonc
"event": {
    "name": "Sapphire Momentum II",
    "subtitle": "2nd Anniversary Edition",
    "dates": "24-26 Nisan",
    "location": "Kremlin Palace, Antalya",
    "address": "..."
  },
```

to:

```jsonc
"event": {
    "name": "Sapphire Momentum II",
    "subtitle": "2nd Anniversary Edition",
    "dates": "24-26 Nisan",
    "location": "Kremlin Palace, Antalya",
    "address": "...",
    "timezone": "Europe/Istanbul"
  },
```

- [ ] **Step 2: Add `"smsReminder": false` to "Giriş" session**

Find the Friday 10:00 "Giriş" session object and add the flag so it reads:

```jsonc
{
  "start": "10:00", "end": "12:30", "type": "general",
  "title": "Giriş", "titleEN": "Entry", "titleRU": "Вход", "titleBG": "Вход", "titleIT": "Ingresso", "titleMN": "Оролт",
  "smsReminder": false
}
```

- [ ] **Step 3: Add `"smsReminder": false` to "Kapı Açılış" session**

Find the Friday 20:30 "Kapı Açılış" session object and add the flag so it reads:

```jsonc
{
  "start": "20:30", "end": null, "type": "general",
  "title": "Kapı Açılış", "titleEN": "Door Opening", "titleRU": "Открытие дверей", "titleBG": "Отваряне на вратите", "titleIT": "Apertura porte", "titleMN": "Хаалга нээлт",
  "smsReminder": false
}
```

- [ ] **Step 4: Validate JSON**

Run: `node -e "JSON.parse(require('fs').readFileSync('schedule.json','utf8'))"`
Expected: no output (valid JSON).

- [ ] **Step 5: Commit**

```bash
git add schedule.json
git commit -m "feat: add event.timezone + smsReminder opt-outs to schedule"
```

---

## Task 4: Extend `lib/schedule.ts` types

**Files:**
- Modify: `lib/schedule.ts`

- [ ] **Step 1: Extend `RawSession` interface with `smsReminder` and `smsMessage`**

In `lib/schedule.ts`, locate the `RawSession` interface (around line 9). Add two new optional fields at the end of the interface body (before the closing `}`):

```ts
  smsReminder?: boolean
  smsMessage?: string
```

Resulting interface should look like:

```ts
export interface RawSession {
  start: string | null
  end: string | null
  title: string
  titleEN?: string
  titleRU?: string
  titleBG?: string
  titleIT?: string
  titleMN?: string
  subtitle?: string
  subtitleEN?: string
  subtitleRU?: string
  subtitleBG?: string
  subtitleIT?: string
  subtitleMN?: string
  type: SessionType
  smsReminder?: boolean
  smsMessage?: string
}
```

- [ ] **Step 2: Add `timezone` to `ScheduleData.event`**

Locate `ScheduleData` (around line 38). Add `timezone: string` to the `event` object:

```ts
export interface ScheduleData {
  event: {
    name: string
    subtitle: string
    dates: string
    location: string
    address: string
    timezone: string
  }
  days: Day[]
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add lib/schedule.ts
git commit -m "feat: extend schedule types with smsReminder/smsMessage + timezone"
```

---

## Task 5: Create Supabase migrations for the 3 new tables

**Files:**
- Supabase project (via `mcp__supabase__apply_migration`)

- [ ] **Step 1: Apply `create_scheduled_messages` migration**

Call `mcp__supabase__apply_migration` with:
- name: `create_scheduled_messages`
- query:

```sql
create table public.scheduled_messages (
  id               uuid primary key default gen_random_uuid(),
  day_idx          int  not null,
  session_idx      int  not null,
  session_title    text not null,
  session_start_at timestamptz not null,
  reminder_at      timestamptz not null,
  message_body     text not null,
  created_at       timestamptz not null default now(),
  unique (day_idx, session_idx)
);
create index scheduled_messages_reminder_at_idx on public.scheduled_messages (reminder_at);

comment on table public.scheduled_messages is
  'The reminder plan: one row per session that should trigger an SMS.';
comment on column public.scheduled_messages.session_start_at is
  'UTC instant when the session starts (computed from schedule.json Istanbul time).';
comment on column public.scheduled_messages.reminder_at is
  'UTC instant when the reminder should fire (session_start_at minus 10 minutes).';
comment on column public.scheduled_messages.message_body is
  'Resolved Turkish template with {name} placeholder remaining. Must be <= 160 chars.';
```

- [ ] **Step 2: Apply `create_message_sends` migration**

Call `mcp__supabase__apply_migration` with:
- name: `create_message_sends`
- query:

```sql
create table public.message_sends (
  id                   uuid primary key default gen_random_uuid(),
  scheduled_message_id uuid not null references public.scheduled_messages(id) on delete cascade,
  registration_id      uuid references public.registrations(id) on delete set null,
  phone_snapshot       text not null,
  status               text not null default 'pending',
  netgsm_jobid         text,
  netgsm_return_code   text,
  published_at         timestamptz,
  delivered_at         timestamptz,
  retry_count          int not null default 0,
  last_error           text,
  last_checked_at      timestamptz,
  alerted_at           timestamptz,
  created_at           timestamptz not null default now(),
  unique (scheduled_message_id, registration_id)
);
create index message_sends_status_idx on public.message_sends (status, last_checked_at);
create index message_sends_sm_idx     on public.message_sends (scheduled_message_id);

comment on column public.message_sends.status is
  'pending | published | publish_rejected | delivered | failed | retry_published | skipped_too_late | canceled';
comment on column public.message_sends.phone_snapshot is
  'Phone in E.164 format at publish time (users could update registrations.phone later).';
```

- [ ] **Step 3: Apply `create_sms_config` migration**

Call `mcp__supabase__apply_migration` with:
- name: `create_sms_config`
- query:

```sql
create table public.sms_config (
  id          int primary key default 1 check (id = 1),
  killswitch  boolean not null default false,
  updated_at  timestamptz not null default now()
);
insert into public.sms_config (id) values (1) on conflict do nothing;

comment on table public.sms_config is
  'Single-row config table. When killswitch = true, publish + watchdog no-op.';
```

- [ ] **Step 4: Verify tables exist**

Call `mcp__supabase__list_tables` with `schemas: ["public"]`. Expected: `scheduled_messages`, `message_sends`, `sms_config`, `registrations` all present.

- [ ] **Step 5: No commit needed** (Supabase migrations live in the remote project, not in the repo per CLAUDE.md convention).

---

## Task 6: Implement `lib/schedule-time.ts` — Istanbul TZ helpers (TDD, critical)

**Files:**
- Create: `lib/schedule-time.ts`
- Test: `lib/schedule-time.test.ts`

- [ ] **Step 1: Write failing tests**

Create `lib/schedule-time.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  sessionStartUtc,
  reminderAtUtc,
  formatNetgsmStartdate,
} from './schedule-time'

describe('sessionStartUtc', () => {
  it('treats schedule times as Europe/Istanbul and returns a UTC Date', () => {
    // Friday April 24, 2026 at 16:15 Istanbul (UTC+3) = 13:15 UTC
    const d = sessionStartUtc('2026-04-24', '16:15', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-24T13:15:00.000Z')
  })

  it('handles early-morning times without DST shift', () => {
    const d = sessionStartUtc('2026-04-25', '07:00', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-25T04:00:00.000Z')
  })

  it('handles late-night times', () => {
    const d = sessionStartUtc('2026-04-24', '21:15', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-24T18:15:00.000Z')
  })

  it('throws when time is null', () => {
    expect(() => sessionStartUtc('2026-04-24', null as unknown as string, 'Europe/Istanbul'))
      .toThrow()
  })
})

describe('reminderAtUtc', () => {
  it('returns session start minus 10 minutes', () => {
    const d = reminderAtUtc('2026-04-24', '16:15', 'Europe/Istanbul')
    expect(d.toISOString()).toBe('2026-04-24T13:05:00.000Z')
  })
})

describe('formatNetgsmStartdate', () => {
  it('formats a UTC Date back to Istanbul wall-clock ddMMyyyyHHmm', () => {
    // 2026-04-24T13:05:00Z = 16:05 Istanbul on April 24
    const d = new Date('2026-04-24T13:05:00.000Z')
    expect(formatNetgsmStartdate(d, 'Europe/Istanbul')).toBe('240420261605')
  })

  it('pads single-digit month, day, hour, minute', () => {
    // 2026-01-02T03:04:00Z = 06:04 Istanbul on Jan 2
    const d = new Date('2026-01-02T03:04:00.000Z')
    expect(formatNetgsmStartdate(d, 'Europe/Istanbul')).toBe('020120260604')
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- schedule-time`
Expected: FAIL (module does not exist).

- [ ] **Step 3: Implement `lib/schedule-time.ts`**

Create `lib/schedule-time.ts`:

```ts
/**
 * Istanbul-anchored date helpers for SMS scheduling.
 *
 * schedule.json stores wall-clock Istanbul times as naive "HH:MM" strings.
 * Vercel functions run in UTC. This module is the ONLY place server-side
 * code should convert schedule times to absolute UTC moments.
 *
 * NOTE: client-side rendering in lib/schedule.ts continues to use setHours()
 * because attendees' phones are in TRT anyway.
 */

/** Parse `YYYY-MM-DD` + `HH:MM` as a wall-clock time in `tz`, return UTC Date. */
export function sessionStartUtc(
  dateStr: string,
  timeStr: string,
  tz: string,
): Date {
  if (!timeStr) throw new Error(`sessionStartUtc: time is required (got ${timeStr})`)
  const [y, m, d] = dateStr.split('-').map(Number)
  const [h, min] = timeStr.split(':').map(Number)

  // Naive Date treats the components as local (UTC on Vercel).
  // We need the UTC instant that corresponds to y-m-d h:min in `tz`.
  // Strategy: compute the offset of that wall-clock moment in `tz` vs UTC,
  // then subtract it from a naive UTC constructed from the components.

  const utcGuess = Date.UTC(y, m - 1, d, h, min, 0, 0)
  const offsetMs = tzOffsetMs(utcGuess, tz)
  return new Date(utcGuess - offsetMs)
}

/** Session start minus 10 minutes. */
export function reminderAtUtc(
  dateStr: string,
  timeStr: string,
  tz: string,
): Date {
  const start = sessionStartUtc(dateStr, timeStr, tz)
  return new Date(start.getTime() - 10 * 60_000)
}

/** Convert a UTC Date to Istanbul wall-clock `ddMMyyyyHHmm` for Netgsm. */
export function formatNetgsmStartdate(d: Date, tz: string): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(d)

  const get = (type: string) =>
    parts.find(p => p.type === type)?.value ?? '00'

  // Intl returns hour "24" for midnight in some locales — normalize.
  const hh = get('hour') === '24' ? '00' : get('hour')

  return `${get('day')}${get('month')}${get('year')}${hh}${get('minute')}`
}

/**
 * Return the offset (in ms) of `tz` for the given UTC instant.
 * Used only by sessionStartUtc to resolve the ambiguity.
 */
function tzOffsetMs(utcMs: number, tz: string): number {
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = dtf.formatToParts(new Date(utcMs))
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? 0)
  const hh = get('hour') === 24 ? 0 : get('hour')
  const asIfLocal = Date.UTC(
    get('year'), get('month') - 1, get('day'),
    hh, get('minute'), get('second'),
  )
  return asIfLocal - utcMs
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- schedule-time`
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/schedule-time.ts lib/schedule-time.test.ts
git commit -m "feat(sms): Istanbul TZ helpers for SMS scheduling"
```

---

## Task 7: Extend `lib/netgsm.ts` with scheduled-send, cancel, and delivery report

**Files:**
- Modify: `lib/netgsm.ts`

- [ ] **Step 1: Add `sendScheduledSms`, `sendImmediateSms`, `cancelScheduledSms`, `getDeliveryReport`**

Append the following to `lib/netgsm.ts` (keep existing `sendWelcomeSms` intact):

```ts
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

/**
 * Shared send implementation for reminders. Same shape as sendWelcomeSms but
 * accepts an optional `startdate` for Netgsm-side scheduling. Turkish encoding
 * is always used for the reminder flow (messages are TR-only per spec).
 */
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

/**
 * Query Netgsm for the delivery status of one or more jobids.
 * Unknown jobids come back as { status: 'unknown' }.
 */
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
    // Network/timeout: treat all as unknown; watchdog will retry on next tick.
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/netgsm.ts
git commit -m "feat(sms): extend Netgsm client with schedule, cancel, report"
```

---

## Task 8: Types and status enum for SMS reminders

**Files:**
- Create: `lib/sms-reminders-types.ts`

- [ ] **Step 1: Create the shared types file**

```ts
/** Status state machine for public.message_sends.status. */
export type MessageSendStatus =
  | 'pending'
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
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/sms-reminders-types.ts
git commit -m "feat(sms): shared types + status enum for reminder system"
```

---

## Task 9: Message template resolution + length lint (TDD)

**Files:**
- Create: `lib/sms-reminders-template.ts`
- Test: `lib/sms-reminders-template.test.ts`

- [ ] **Step 1: Write failing tests**

```ts
import { describe, it, expect } from 'vitest'
import {
  resolveMessage,
  validateTemplateLength,
  DEFAULT_TEMPLATE,
} from './sms-reminders-template'

describe('resolveMessage', () => {
  it('substitutes {name} and {session} in the default template', () => {
    const msg = resolveMessage({
      template: DEFAULT_TEMPLATE,
      firstName: 'Berk',
      sessionTitle: 'Ruby Okulu',
    })
    expect(msg).toBe('Sevgili Berk, Ruby Okulu birazdan başlıyor. Görüşmek üzere.')
  })

  it('uses the session override when provided', () => {
    const msg = resolveMessage({
      template: 'Sevgili {name}, {session} başlıyor.',
      firstName: 'Ayşe',
      sessionTitle: 'Takdir Töreni',
    })
    expect(msg).toBe('Sevgili Ayşe, Takdir Töreni başlıyor.')
  })

  it('trims excess whitespace in names', () => {
    const msg = resolveMessage({
      template: DEFAULT_TEMPLATE,
      firstName: '  Berk  ',
      sessionTitle: 'Eğitim - 1',
    })
    expect(msg.includes(' Berk,')).toBe(true)
    expect(msg.includes('  Berk')).toBe(false)
  })
})

describe('validateTemplateLength', () => {
  it('accepts messages at or under 160 chars', () => {
    const result = validateTemplateLength('a'.repeat(160))
    expect(result.ok).toBe(true)
  })

  it('rejects messages over 160 chars', () => {
    const result = validateTemplateLength('a'.repeat(161))
    expect(result.ok).toBe(false)
    expect(result.reason).toMatch(/160/)
  })

  it('correctly measures resolved worst-case default template', () => {
    const worst = resolveMessage({
      template: DEFAULT_TEMPLATE,
      firstName: 'Aleksandra-Emmanuelle',
      sessionTitle: 'Sistem Kurmak: Sen Olmadan Çalışan Organizasyon',
    })
    const result = validateTemplateLength(worst)
    expect(result.ok).toBe(true)
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- sms-reminders-template`
Expected: FAIL (module missing).

- [ ] **Step 3: Implement `lib/sms-reminders-template.ts`**

```ts
export const DEFAULT_TEMPLATE =
  'Sevgili {name}, {session} birazdan başlıyor. Görüşmek üzere.'

/** Maximum GSM-7 + Turkish shift-table segment size. */
export const MAX_SEGMENT_LENGTH = 160

export interface ResolveMessageInput {
  template: string
  firstName: string
  sessionTitle: string
}

export function resolveMessage(input: ResolveMessageInput): string {
  const name = input.firstName.trim()
  const session = input.sessionTitle.trim()
  return input.template.replace('{name}', name).replace('{session}', session)
}

export interface TemplateLengthResult {
  ok: boolean
  length: number
  reason?: string
}

export function validateTemplateLength(resolved: string): TemplateLengthResult {
  const length = resolved.length
  if (length > MAX_SEGMENT_LENGTH) {
    return {
      ok: false,
      length,
      reason: `Message is ${length} chars — exceeds 160-char single-segment limit`,
    }
  }
  return { ok: true, length }
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- sms-reminders-template`
Expected: all 6 tests PASS.

- [ ] **Step 5: Commit**

```bash
git add lib/sms-reminders-template.ts lib/sms-reminders-template.test.ts
git commit -m "feat(sms): template resolution + segment-length validator"
```

---

## Task 10: Schedule loader (`schedule.json` vs `schedule.dev.json`)

**Files:**
- Create: `lib/schedule-loader.ts`

- [ ] **Step 1: Implement loader**

```ts
import type { ScheduleData } from './schedule'
import scheduleProd from '@/schedule.json'

/**
 * Returns the active schedule.
 * When USE_DEV_SCHEDULE=true (preview deployments only), loads schedule.dev.json
 * instead. Dynamic import because schedule.dev.json may not exist in all branches.
 */
export async function loadSchedule(): Promise<ScheduleData> {
  if (process.env.USE_DEV_SCHEDULE === 'true') {
    try {
      const dev = (await import('@/schedule.dev.json')).default
      return dev as unknown as ScheduleData
    } catch {
      console.warn('USE_DEV_SCHEDULE=true but schedule.dev.json missing; falling back to schedule.json')
    }
  }
  return scheduleProd as unknown as ScheduleData
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/schedule-loader.ts
git commit -m "feat(sms): schedule loader with dev-schedule env var switch"
```

---

## Task 11: `publishPendingReminders` — core publish logic

**Files:**
- Create: `lib/sms-reminders-publish.ts`

- [ ] **Step 1: Implement the publish core**

```ts
import { supabaseAdmin } from './supabase-server'
import { normalizePhone } from './phone'
import { sendScheduledSms } from './netgsm'
import { loadSchedule } from './schedule-loader'
import { sessionStartUtc, reminderAtUtc, formatNetgsmStartdate } from './schedule-time'
import {
  DEFAULT_TEMPLATE,
  resolveMessage,
  validateTemplateLength,
} from './sms-reminders-template'
import {
  type PublishScope,
  type PublishSummary,
  type MessageSendStatus,
  PUBLISH_CUTOFF_MS,
} from './sms-reminders-types'

/**
 * Publishes pending reminders to Netgsm.
 *
 * Idempotent: safe to call from the inline registration hook, the watchdog
 * cron, and the admin endpoint concurrently — the DB unique constraints
 * (day_idx,session_idx) and (scheduled_message_id,registration_id) prevent
 * duplicate publishes.
 */
export async function publishPendingReminders(scope: PublishScope): Promise<PublishSummary> {
  const summary: PublishSummary = {
    scheduledMessagesInserted: 0,
    messageSendsInserted: 0,
    published: 0,
    publishRejected: 0,
    skippedTooLate: 0,
  }

  // 1. Killswitch check.
  const { data: config } = await supabaseAdmin
    .from('sms_config')
    .select('killswitch')
    .eq('id', 1)
    .single()
  if (config?.killswitch) {
    console.log('[publish] killswitch on — no-op')
    return summary
  }

  const tz = 'Europe/Istanbul' // value also present in schedule.event.timezone
  const schedule = await loadSchedule()

  // 2. Upsert scheduled_messages for every eligible session.
  for (let dayIdx = 0; dayIdx < schedule.days.length; dayIdx++) {
    const day = schedule.days[dayIdx]
    for (let sessionIdx = 0; sessionIdx < day.sessions.length; sessionIdx++) {
      const s = day.sessions[sessionIdx]
      if (s.smsReminder === false) continue   // explicit opt-out
      if (s.type === 'meal' || s.type === 'break') continue
      if (!s.start) continue                   // cannot schedule

      const startAt = sessionStartUtc(day.date, s.start, schedule.event.timezone ?? tz)
      const remindAt = reminderAtUtc(day.date, s.start, schedule.event.timezone ?? tz)

      const template = s.smsMessage ?? DEFAULT_TEMPLATE

      // CI-style lint: worst-case resolution must fit 1 segment.
      const probe = resolveMessage({
        template,
        firstName: 'Aleksandra-Emmanuelle',
        sessionTitle: s.title,
      })
      const check = validateTemplateLength(probe)
      if (!check.ok) {
        throw new Error(
          `Template for session "${s.title}" (day ${dayIdx}, idx ${sessionIdx}) too long: ${check.reason}`,
        )
      }

      const { error, data } = await supabaseAdmin
        .from('scheduled_messages')
        .upsert(
          {
            day_idx: dayIdx,
            session_idx: sessionIdx,
            session_title: s.title,
            session_start_at: startAt.toISOString(),
            reminder_at: remindAt.toISOString(),
            message_body: template,
          },
          { onConflict: 'day_idx,session_idx', ignoreDuplicates: false },
        )
        .select('id')
      if (error) throw new Error(`upsert scheduled_messages failed: ${error.message}`)
      if (data && data.length > 0) summary.scheduledMessagesInserted += data.length
    }
  }

  // 3. Load candidate registrations (scope-filtered).
  const regQuery = supabaseAdmin
    .from('registrations')
    .select('id, first_name, phone')

  if (scope.kind === 'registration') regQuery.eq('id', scope.registrationId)
  const { data: regs, error: regErr } = await regQuery
  if (regErr) throw new Error(`load registrations failed: ${regErr.message}`)
  if (!regs || regs.length === 0) return summary

  // 4. Load scheduled messages in scope.
  const smQuery = supabaseAdmin
    .from('scheduled_messages')
    .select('id, day_idx, session_idx, session_title, reminder_at, session_start_at, message_body')
  if (scope.kind === 'session') {
    smQuery.eq('day_idx', scope.dayIdx).eq('session_idx', scope.sessionIdx)
  }
  const { data: scheduled, error: smErr } = await smQuery
  if (smErr) throw new Error(`load scheduled_messages failed: ${smErr.message}`)
  if (!scheduled || scheduled.length === 0) return summary

  const now = Date.now()

  // 5. For each (scheduled × registration) pair, insert a pending row if missing.
  for (const sm of scheduled) {
    const reminderAt = new Date(sm.reminder_at).getTime()
    if (reminderAt <= now + PUBLISH_CUTOFF_MS) continue // too late to schedule

    for (const reg of regs) {
      const normalized = normalizePhone(reg.phone)
      const phoneSnapshot = normalized?.e164 ?? reg.phone

      const { data, error } = await supabaseAdmin
        .from('message_sends')
        .upsert(
          {
            scheduled_message_id: sm.id,
            registration_id: reg.id,
            phone_snapshot: phoneSnapshot,
            status: 'pending' as MessageSendStatus,
          },
          { onConflict: 'scheduled_message_id,registration_id', ignoreDuplicates: true },
        )
        .select('id')
      if (error) throw new Error(`upsert message_sends failed: ${error.message}`)
      if (data && data.length > 0) summary.messageSendsInserted += data.length
    }
  }

  // 6. Send everything that is still 'pending' for sessions in scope.
  const sendQuery = supabaseAdmin
    .from('message_sends')
    .select('id, scheduled_message_id, registration_id, phone_snapshot')
    .eq('status', 'pending')

  const scheduledIds = scheduled.map(s => s.id)
  sendQuery.in('scheduled_message_id', scheduledIds)

  const { data: pending, error: pendErr } = await sendQuery
  if (pendErr) throw new Error(`load pending sends failed: ${pendErr.message}`)
  if (!pending) return summary

  const smById = new Map(scheduled.map(s => [s.id, s]))
  const regById = new Map(regs.map(r => [r.id, r]))

  for (const send of pending) {
    const sm = smById.get(send.scheduled_message_id)
    if (!sm) continue
    const reg = send.registration_id ? regById.get(send.registration_id) : null
    if (!reg) continue

    const reminderMs = new Date(sm.reminder_at).getTime()

    // Mark too-late rows rather than calling Netgsm.
    if (reminderMs <= Date.now() + PUBLISH_CUTOFF_MS) {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'skipped_too_late', last_error: 'reminder within 2-min cutoff at publish time' })
        .eq('id', send.id)
      summary.skippedTooLate++
      continue
    }

    const normalized = normalizePhone(send.phone_snapshot)
    if (!normalized) {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'publish_rejected',
          netgsm_return_code: 'INVALID_PHONE',
          last_error: 'phone did not parse to valid E.164',
        })
        .eq('id', send.id)
      summary.publishRejected++
      continue
    }

    const resolved = resolveMessage({
      template: sm.message_body,
      firstName: reg.first_name,
      sessionTitle: sm.session_title,
    })
    const startdate = formatNetgsmStartdate(new Date(sm.reminder_at), 'Europe/Istanbul')

    const result = await sendScheduledSms({
      phoneNational: normalized.national,
      message: resolved,
      startdate,
    })

    if (result.success && result.jobid) {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'published',
          netgsm_jobid: result.jobid,
          netgsm_return_code: result.code,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', send.id)
      summary.published++
    } else if (result.code === 'TIMEOUT' || result.code === 'NETWORK_ERROR') {
      // Leave as 'pending' — watchdog will retry.
      console.warn('[publish] transient error, leaving pending:', result.code, send.id)
    } else {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'publish_rejected',
          netgsm_return_code: result.code,
          last_error: `Netgsm rejected publish with code ${result.code}`,
        })
        .eq('id', send.id)
      summary.publishRejected++
    }
  }

  return summary
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/sms-reminders-publish.ts
git commit -m "feat(sms): publishPendingReminders — core publish logic"
```

---

## Task 12: Reconcile delivery reports + single-retry logic

**Files:**
- Create: `lib/sms-reminders-reconcile.ts`

- [ ] **Step 1: Implement reconcile + retry**

```ts
import { supabaseAdmin } from './supabase-server'
import { normalizePhone } from './phone'
import { sendImmediateSms, getDeliveryReport } from './netgsm'
import { resolveMessage } from './sms-reminders-template'

export interface ReconcileSummary {
  checked: number
  delivered: number
  failed: number
  retried: number
}

/**
 * For every published row whose reminder_at is at least 3 minutes in the past
 * and hasn't been recently polled, query Netgsm for its delivery status and
 * update the row. Batched by jobid.
 */
export async function reconcileDeliveryReports(): Promise<ReconcileSummary> {
  const summary: ReconcileSummary = { checked: 0, delivered: 0, failed: 0, retried: 0 }

  const now = Date.now()
  const threeMinAgo = new Date(now - 3 * 60_000).toISOString()
  const fiveMinAgo  = new Date(now - 5 * 60_000).toISOString()

  // Load published rows whose reminder should have fired and which we haven't
  // checked recently. Include the scheduled_message to see session_start_at.
  const { data: rows, error } = await supabaseAdmin
    .from('message_sends')
    .select(`
      id, netgsm_jobid, status, scheduled_message_id,
      scheduled_messages ( id, session_start_at, reminder_at, message_body, session_title ),
      registration_id, phone_snapshot,
      registrations ( first_name )
    `)
    .in('status', ['published', 'retry_published'])
    .not('netgsm_jobid', 'is', null)
    .lt('scheduled_messages.reminder_at', threeMinAgo)
    .or(`last_checked_at.is.null,last_checked_at.lt.${fiveMinAgo}`)
    .limit(200)
  if (error) throw new Error(`reconcile: load published failed: ${error.message}`)
  if (!rows || rows.length === 0) return summary

  // Batch-query Netgsm for delivery status.
  const jobids = rows.map(r => r.netgsm_jobid!).filter(Boolean)
  const reports = await getDeliveryReport(jobids)
  const reportByJobId = new Map(reports.map(r => [r.jobid, r]))

  // Apply updates, then look for retry candidates.
  for (const row of rows) {
    const report = row.netgsm_jobid ? reportByJobId.get(row.netgsm_jobid) : undefined
    const nowIso = new Date().toISOString()
    summary.checked++

    if (!report || report.status === 'unknown' || report.status === 'pending') {
      await supabaseAdmin
        .from('message_sends')
        .update({ last_checked_at: nowIso, last_error: report?.raw ?? null })
        .eq('id', row.id)
      continue
    }
    if (report.status === 'delivered') {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'delivered', delivered_at: nowIso, last_checked_at: nowIso })
        .eq('id', row.id)
      summary.delivered++
      continue
    }
    if (report.status === 'failed') {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'failed', last_checked_at: nowIso, last_error: report.raw ?? 'delivery failed' })
        .eq('id', row.id)
      summary.failed++
    }
  }

  // Single retry path — only for rows still useful.
  const { data: retryRows, error: retryErr } = await supabaseAdmin
    .from('message_sends')
    .select(`
      id, phone_snapshot,
      scheduled_messages ( session_start_at, message_body, session_title ),
      registrations ( first_name )
    `)
    .eq('status', 'failed')
    .eq('retry_count', 0)
    .limit(50)
  if (retryErr) throw new Error(`reconcile: load retry candidates failed: ${retryErr.message}`)
  if (!retryRows) return summary

  const retryCutoff = new Date(now - 5 * 60_000) // session must have started no more than 5 min ago

  for (const row of retryRows) {
    const sm = (row as unknown as { scheduled_messages: { session_start_at: string; message_body: string; session_title: string } }).scheduled_messages
    const reg = (row as unknown as { registrations: { first_name: string } | null }).registrations
    if (!sm || !reg) continue

    if (new Date(sm.session_start_at) < retryCutoff) continue // too old — skip retry

    const normalized = normalizePhone(row.phone_snapshot)
    if (!normalized) continue

    const message = resolveMessage({
      template: sm.message_body,
      firstName: reg.first_name,
      sessionTitle: sm.session_title,
    })

    const result = await sendImmediateSms({
      phoneNational: normalized.national,
      message,
    })

    if (result.success && result.jobid) {
      await supabaseAdmin
        .from('message_sends')
        .update({
          status: 'retry_published',
          retry_count: 1,
          netgsm_jobid: result.jobid,
          netgsm_return_code: result.code,
          published_at: new Date().toISOString(),
          last_error: null,
        })
        .eq('id', row.id)
      summary.retried++
    } else {
      await supabaseAdmin
        .from('message_sends')
        .update({
          retry_count: 1,
          last_error: `retry rejected: ${result.code}`,
        })
        .eq('id', row.id)
    }
  }

  return summary
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/sms-reminders-reconcile.ts
git commit -m "feat(sms): reconcile delivery reports + single-retry logic"
```

---

## Task 13: Telegram alerting

**Files:**
- Create: `lib/telegram.ts`

- [ ] **Step 1: Implement `alertOps`**

```ts
export type Severity = 'info' | 'warn' | 'error'

const SEV_ICON: Record<Severity, string> = {
  info:  'INFO',
  warn:  'WARN',
  error: 'ERROR',
}

/**
 * Post a short alert to the operator Telegram channel.
 *
 * Never throws — if envs are missing or Telegram is down, logs and returns.
 * Alerting must never break the watchdog.
 */
export async function alertOps(
  severity: Severity,
  summary: string,
  details?: Record<string, unknown>,
): Promise<void> {
  const token  = process.env.TELEGRAM_BOT_TOKEN
  const chatId = process.env.TELEGRAM_CHAT_ID
  if (!token || !chatId) {
    console.warn('[telegram] missing TELEGRAM_BOT_TOKEN/CHAT_ID; alert dropped:', summary)
    return
  }

  const lines = [`[SMS ALERT · ${SEV_ICON[severity]}]`, summary]
  if (details && Object.keys(details).length > 0) {
    for (const [k, v] of Object.entries(details)) {
      lines.push(`${k}: ${typeof v === 'string' ? v : JSON.stringify(v)}`)
    }
  }
  const text = lines.join('\n')

  try {
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
      signal: AbortSignal.timeout(10_000),
    })
    if (!res.ok) {
      console.warn('[telegram] sendMessage non-2xx:', res.status, await res.text().catch(() => ''))
    }
  } catch (err) {
    console.warn('[telegram] sendMessage failed:', err)
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/telegram.ts
git commit -m "feat(sms): Telegram bot alerting (never throws)"
```

---

## Task 14: Admin bearer-token auth helper

**Files:**
- Create: `lib/admin-auth.ts`

- [ ] **Step 1: Implement `requireAdminAuth`**

```ts
import { NextResponse } from 'next/server'

/**
 * Returns null when authorized, or a NextResponse 401/403 when not.
 * Routes call this first and short-circuit on the returned response.
 */
export function requireAdminAuth(request: Request): NextResponse | null {
  const expected = process.env.ADMIN_SECRET
  if (!expected) {
    return NextResponse.json(
      { error: 'ADMIN_SECRET not configured on server' },
      { status: 500 },
    )
  }
  const header = request.headers.get('authorization') ?? ''
  const url = new URL(request.url)
  const queryToken = url.searchParams.get('token')

  const bearer = header.startsWith('Bearer ') ? header.slice(7) : ''
  const token = bearer || queryToken

  if (!token) {
    return NextResponse.json({ error: 'missing token' }, { status: 401 })
  }
  if (!timingSafeEqual(token, expected)) {
    return NextResponse.json({ error: 'invalid token' }, { status: 403 })
  }
  return null
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add lib/admin-auth.ts
git commit -m "feat(sms): admin bearer-token auth helper"
```

---

## Task 15: `GET /api/admin/sms/status` endpoint

**Files:**
- Create: `app/api/admin/sms/status/route.ts`

- [ ] **Step 1: Implement status route**

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const { data: scheduled, error: smErr } = await supabaseAdmin
    .from('scheduled_messages')
    .select('id, day_idx, session_idx, session_title, session_start_at, reminder_at')
    .order('session_start_at', { ascending: true })
  if (smErr) return NextResponse.json({ error: smErr.message }, { status: 500 })

  const { data: sends, error: sendsErr } = await supabaseAdmin
    .from('message_sends')
    .select('scheduled_message_id, status')
  if (sendsErr) return NextResponse.json({ error: sendsErr.message }, { status: 500 })

  const counts = new Map<string, Record<string, number>>()
  for (const s of sends ?? []) {
    const key = s.scheduled_message_id
    const bucket = counts.get(key) ?? {}
    bucket[s.status] = (bucket[s.status] ?? 0) + 1
    counts.set(key, bucket)
  }

  const sessions = (scheduled ?? []).map(sm => ({
    id: sm.id,
    dayIdx: sm.day_idx,
    sessionIdx: sm.session_idx,
    title: sm.session_title,
    sessionStartAt: sm.session_start_at,
    reminderAt: sm.reminder_at,
    counts: counts.get(sm.id) ?? {},
  }))

  const totals: Record<string, number> = {}
  for (const s of sends ?? []) totals[s.status] = (totals[s.status] ?? 0) + 1

  const { data: cfg } = await supabaseAdmin
    .from('sms_config')
    .select('killswitch')
    .eq('id', 1)
    .single()

  return NextResponse.json({
    killswitch: cfg?.killswitch ?? false,
    totals,
    sessions,
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/sms/status/route.ts
git commit -m "feat(sms): GET /api/admin/sms/status endpoint"
```

---

## Task 16: `POST /api/admin/sms/publish-all` endpoint

**Files:**
- Create: `app/api/admin/sms/publish-all/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-auth'
import { publishPendingReminders } from '@/lib/sms-reminders-publish'

export const dynamic = 'force-dynamic'
export const maxDuration = 120 // Netgsm calls in a tight loop may take a while

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  try {
    const summary = await publishPendingReminders({ kind: 'all' })
    return NextResponse.json({ ok: true, summary })
  } catch (err) {
    console.error('[publish-all] failed:', err)
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 },
    )
  }
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/sms/publish-all/route.ts
git commit -m "feat(sms): POST /api/admin/sms/publish-all endpoint"
```

---

## Task 17: `POST /api/admin/sms/cancel` endpoint

**Files:**
- Create: `app/api/admin/sms/cancel/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { cancelScheduledSms } from '@/lib/netgsm'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 60

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const url = new URL(request.url)
  const scheduledMessageId = url.searchParams.get('scheduled_message_id')
  if (!scheduledMessageId) {
    return NextResponse.json({ error: 'scheduled_message_id required' }, { status: 400 })
  }

  const { data: rows, error } = await supabaseAdmin
    .from('message_sends')
    .select('id, netgsm_jobid')
    .eq('scheduled_message_id', scheduledMessageId)
    .in('status', ['published', 'retry_published'])
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let canceled = 0
  let failed = 0
  for (const row of rows ?? []) {
    if (!row.netgsm_jobid) continue
    const res = await cancelScheduledSms(row.netgsm_jobid)
    if (res.success) {
      await supabaseAdmin
        .from('message_sends')
        .update({ status: 'canceled', last_error: `canceled via admin at ${new Date().toISOString()}` })
        .eq('id', row.id)
      canceled++
    } else {
      failed++
    }
  }

  return NextResponse.json({ ok: true, canceled, failed })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/sms/cancel/route.ts
git commit -m "feat(sms): POST /api/admin/sms/cancel endpoint"
```

---

## Task 18: `POST /api/admin/sms/resend` endpoint

**Files:**
- Create: `app/api/admin/sms/resend/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { normalizePhone } from '@/lib/phone'
import { sendImmediateSms } from '@/lib/netgsm'
import { resolveMessage } from '@/lib/sms-reminders-template'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'
export const maxDuration = 30

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const url = new URL(request.url)
  const messageSendId = url.searchParams.get('message_send_id')
  if (!messageSendId) {
    return NextResponse.json({ error: 'message_send_id required' }, { status: 400 })
  }

  const { data: row, error } = await supabaseAdmin
    .from('message_sends')
    .select(`
      id, phone_snapshot, registration_id,
      scheduled_messages ( session_title, message_body ),
      registrations ( first_name )
    `)
    .eq('id', messageSendId)
    .single()
  if (error || !row) {
    return NextResponse.json({ error: error?.message ?? 'not found' }, { status: 404 })
  }

  const sm = (row as unknown as { scheduled_messages: { session_title: string; message_body: string } }).scheduled_messages
  const reg = (row as unknown as { registrations: { first_name: string } | null }).registrations
  if (!sm || !reg) {
    return NextResponse.json({ error: 'scheduled_message or registration missing' }, { status: 400 })
  }

  const normalized = normalizePhone(row.phone_snapshot)
  if (!normalized) {
    return NextResponse.json({ error: 'phone did not parse' }, { status: 400 })
  }

  const message = resolveMessage({
    template: sm.message_body,
    firstName: reg.first_name,
    sessionTitle: sm.session_title,
  })

  const result = await sendImmediateSms({
    phoneNational: normalized.national,
    message,
  })

  if (result.success && result.jobid) {
    await supabaseAdmin
      .from('message_sends')
      .update({
        status: 'retry_published',
        netgsm_jobid: result.jobid,
        netgsm_return_code: result.code,
        retry_count: 1,
        published_at: new Date().toISOString(),
        last_error: 'manual resend via admin',
      })
      .eq('id', row.id)
    return NextResponse.json({ ok: true, jobid: result.jobid, code: result.code })
  }

  return NextResponse.json(
    { ok: false, code: result.code, message: 'Netgsm rejected immediate send' },
    { status: 502 },
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/sms/resend/route.ts
git commit -m "feat(sms): POST /api/admin/sms/resend endpoint"
```

---

## Task 19: `POST /api/admin/sms/killswitch` endpoint

**Files:**
- Create: `app/api/admin/sms/killswitch/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const body = await request.json().catch(() => null) as { on?: boolean } | null
  if (!body || typeof body.on !== 'boolean') {
    return NextResponse.json({ error: 'body must be {"on": boolean}' }, { status: 400 })
  }

  const { error } = await supabaseAdmin
    .from('sms_config')
    .update({ killswitch: body.on, updated_at: new Date().toISOString() })
    .eq('id', 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true, killswitch: body.on })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/sms/killswitch/route.ts
git commit -m "feat(sms): POST /api/admin/sms/killswitch endpoint"
```

---

## Task 20: `POST /api/admin/sms/preflight` endpoint

**Files:**
- Create: `app/api/admin/sms/preflight/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from 'next/server'
import { normalizePhone } from '@/lib/phone'
import { sendScheduledSms } from '@/lib/netgsm'
import { formatNetgsmStartdate } from '@/lib/schedule-time'
import { requireAdminAuth } from '@/lib/admin-auth'

export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  const authFail = requireAdminAuth(request)
  if (authFail) return authFail

  const body = await request.json().catch(() => null) as { phone?: string } | null
  if (!body?.phone) {
    return NextResponse.json({ error: 'body must be {"phone": "+90..."}' }, { status: 400 })
  }
  const normalized = normalizePhone(body.phone)
  if (!normalized) {
    return NextResponse.json({ error: 'phone did not parse' }, { status: 400 })
  }

  const expectedArrival = new Date(Date.now() + 15 * 60_000)
  const startdate = formatNetgsmStartdate(expectedArrival, 'Europe/Istanbul')

  const result = await sendScheduledSms({
    phoneNational: normalized.national,
    message: `Preflight TZ check. Gönderim beklenen: ${expectedArrival.toISOString()} UTC.`,
    startdate,
  })

  return NextResponse.json({
    ok: result.success,
    jobid: result.jobid,
    code: result.code,
    startdate,
    expectedArrivalUtc: expectedArrival.toISOString(),
  })
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/admin/sms/preflight/route.ts
git commit -m "feat(sms): POST /api/admin/sms/preflight endpoint"
```

---

## Task 21: Watchdog cron endpoint `GET /api/cron/sms-watchdog`

**Files:**
- Create: `app/api/cron/sms-watchdog/route.ts`

- [ ] **Step 1: Implement**

```ts
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-server'
import { publishPendingReminders } from '@/lib/sms-reminders-publish'
import { reconcileDeliveryReports } from '@/lib/sms-reminders-reconcile'
import { alertOps } from '@/lib/telegram'

export const dynamic = 'force-dynamic'
export const maxDuration = 120

export async function GET(request: Request) {
  // Vercel Cron adds this header when invoking scheduled routes.
  // In production we trust the header; in dev we accept any caller.
  if (process.env.NODE_ENV === 'production') {
    const authHeader = request.headers.get('authorization') ?? ''
    const cronSecret = process.env.CRON_SECRET
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
    }
  }

  const started = Date.now()
  const result: Record<string, unknown> = {}

  try {
    result.publish = await publishPendingReminders({ kind: 'all' })
  } catch (err) {
    result.publishError = err instanceof Error ? err.message : String(err)
    await alertOps('error', 'watchdog: publishPendingReminders threw', { error: String(err) })
  }

  try {
    result.reconcile = await reconcileDeliveryReports()
  } catch (err) {
    result.reconcileError = err instanceof Error ? err.message : String(err)
    await alertOps('error', 'watchdog: reconcileDeliveryReports threw', { error: String(err) })
  }

  // Alert on terminal-failure rows that haven't been alerted yet.
  const { data: needsAlert } = await supabaseAdmin
    .from('message_sends')
    .select('id, scheduled_message_id, status, netgsm_return_code, last_error, phone_snapshot, retry_count')
    .is('alerted_at', null)
    .or('status.eq.publish_rejected,and(status.eq.failed,retry_count.gte.1)')
    .limit(25)

  let alertsFired = 0
  for (const row of needsAlert ?? []) {
    await alertOps('error', `message_send terminal: ${row.status}`, {
      id: row.id,
      status: row.status,
      code: row.netgsm_return_code ?? '(none)',
      error: row.last_error ?? '(none)',
      phone: row.phone_snapshot,
    })
    await supabaseAdmin
      .from('message_sends')
      .update({ alerted_at: new Date().toISOString() })
      .eq('id', row.id)
    alertsFired++
  }
  result.alertsFired = alertsFired
  result.elapsedMs = Date.now() - started

  return NextResponse.json(result)
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/api/cron/sms-watchdog/route.ts
git commit -m "feat(sms): GET /api/cron/sms-watchdog — 5-min watchdog endpoint"
```

---

## Task 22: Cron configuration — `vercel.ts`

**Files:**
- Create: `vercel.ts`

- [ ] **Step 1: Install `@vercel/config`**

Run: `npm install --save-dev @vercel/config`
Expected: package added under devDependencies.

- [ ] **Step 2: Create `vercel.ts`**

```ts
import { type VercelConfig } from '@vercel/config/v1'

export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [
    { path: '/api/cron/sms-watchdog', schedule: '*/5 * * * *' },
  ],
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json vercel.ts
git commit -m "feat(sms): configure 5-min watchdog cron via vercel.ts"
```

---

## Task 23: Admin status page `/admin/sms`

**Files:**
- Create: `app/admin/sms/page.tsx`

- [ ] **Step 1: Implement**

```tsx
import { notFound } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Search {
  token?: string
}

interface Props {
  searchParams: Promise<Search>
}

export default async function AdminSmsPage({ searchParams }: Props) {
  const { token } = await searchParams
  if (!process.env.ADMIN_SECRET || token !== process.env.ADMIN_SECRET) {
    notFound()
  }

  const { data: scheduled } = await supabaseAdmin
    .from('scheduled_messages')
    .select('id, day_idx, session_idx, session_title, session_start_at, reminder_at')
    .order('session_start_at', { ascending: true })

  const { data: sends } = await supabaseAdmin
    .from('message_sends')
    .select('scheduled_message_id, status')

  const counts = new Map<string, Record<string, number>>()
  for (const s of sends ?? []) {
    const bucket = counts.get(s.scheduled_message_id) ?? {}
    bucket[s.status] = (bucket[s.status] ?? 0) + 1
    counts.set(s.scheduled_message_id, bucket)
  }

  const { data: cfg } = await supabaseAdmin
    .from('sms_config').select('killswitch').eq('id', 1).single()

  return (
    <main style={{ fontFamily: 'system-ui', padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h1>SMS Status</h1>
      <p>
        Killswitch: <strong>{cfg?.killswitch ? 'ON (all publishing halted)' : 'off'}</strong>
      </p>

      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '1px solid #ccc' }}>
            <th>Session</th>
            <th>Start (UTC)</th>
            <th>Pending</th>
            <th>Published</th>
            <th>Delivered</th>
            <th>Failed</th>
            <th>Rejected</th>
            <th>Skipped</th>
            <th>Canceled</th>
          </tr>
        </thead>
        <tbody>
          {(scheduled ?? []).map(sm => {
            const c = counts.get(sm.id) ?? {}
            const color =
              (c.publish_rejected || c.failed) ? '#fee' :
              (c.pending || c.published)       ? '#ffe' :
                                                 '#efe'
            return (
              <tr key={sm.id} style={{ background: color, borderBottom: '1px solid #eee' }}>
                <td>{sm.session_title}</td>
                <td>{new Date(sm.session_start_at).toISOString().slice(0, 16)}</td>
                <td>{c.pending ?? 0}</td>
                <td>{c.published ?? 0}</td>
                <td>{c.delivered ?? 0}</td>
                <td>{c.failed ?? 0}</td>
                <td>{c.publish_rejected ?? 0}</td>
                <td>{c.skipped_too_late ?? 0}</td>
                <td>{c.canceled ?? 0}</td>
              </tr>
            )
          })}
        </tbody>
      </table>

      <h2 style={{ marginTop: 32 }}>Admin commands</h2>
      <pre style={{ background: '#f4f4f4', padding: 12, borderRadius: 6, fontSize: 12, overflow: 'auto' }}>
{`curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  https://<host>/api/admin/sms/publish-all

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  "https://<host>/api/admin/sms/cancel?scheduled_message_id=<id>"

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  "https://<host>/api/admin/sms/resend?message_send_id=<id>"

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  -H "Content-Type: application/json" -d '{"on":true}' \\
  https://<host>/api/admin/sms/killswitch

curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \\
  -H "Content-Type: application/json" -d '{"phone":"+90..."}' \\
  https://<host>/api/admin/sms/preflight`}
      </pre>
    </main>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add app/admin/sms/page.tsx
git commit -m "feat(sms): /admin/sms status page"
```

---

## Task 24: Inline hook — register action calls `publishPendingReminders`

**Files:**
- Modify: `app/actions/register.ts`

- [ ] **Step 1: Add import and publish call**

At the top of `app/actions/register.ts`, add import:

```ts
import { publishPendingReminders } from '@/lib/sms-reminders-publish'
```

- [ ] **Step 2: Capture inserted ID + fire-and-forget publish**

Change the end of the function from:

```ts
  const { error } = await supabaseAdmin.from('registrations').insert({
    first_name:           data.firstName,
    last_name:            data.lastName,
    phone:                normalized?.e164 ?? data.phone,
    email:                data.email || null,
    consent:              data.consent,
    phone_country_code:   normalized?.country ?? null,
    sms_successful:       smsSuccessful,
    sms_api_return_code:  smsCode,
    sms_jobid:            smsJobid,
  })
  if (error) throw new Error(error.message)
}
```

to:

```ts
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
  if (error) throw new Error(error.message)

  try {
    await publishPendingReminders({ kind: 'registration', registrationId: inserted.id })
  } catch (err) {
    // Watchdog will catch up on next tick. Never block registration on this.
    console.error('[register] inline reminder publish failed', err)
  }
}
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add app/actions/register.ts
git commit -m "feat(sms): publish reminders inline on new registration"
```

---

## Task 25: Event clock hook for time-injection tests (Layer 1)

**Files:**
- Create: `lib/event-clock.ts`
- Modify: `hooks/useSchedule.ts` (lines 17-23 — the `now` state + tick `useEffect`)

- [ ] **Step 1: Implement `lib/event-clock.ts`**

```ts
'use client'

/**
 * Dev-only time injection.
 *
 *   ?now=2026-04-25T15:00:00+03:00             freeze at this instant
 *   ?now=2026-04-24T09:00:00+03:00&speed=60    play forward at 60x realtime
 *
 * In production, or when no `?now` is present, behaves as realtime.
 */

export interface EventClockConfig {
  /** Virtual time when the clock started running. */
  baseVirtual: Date
  /** Real Date.now() captured when the clock started. */
  baseReal: number
  /** Time multiplier. 0 = frozen, 1 = realtime, N = N× realtime. */
  speed: number
}

/** Read URL params on the client and produce a clock config. SSR-safe. */
export function parseEventClock(): EventClockConfig {
  if (process.env.NODE_ENV === 'production' || typeof window === 'undefined') {
    return { baseVirtual: new Date(), baseReal: Date.now(), speed: 1 }
  }
  const params = new URLSearchParams(window.location.search)
  const nowParam = params.get('now')
  const speedParam = params.get('speed')

  if (!nowParam) {
    return { baseVirtual: new Date(), baseReal: Date.now(), speed: 1 }
  }

  const baseVirtual = new Date(nowParam)
  if (Number.isNaN(baseVirtual.getTime())) {
    console.warn('[event-clock] invalid ?now=, falling back to real time')
    return { baseVirtual: new Date(), baseReal: Date.now(), speed: 1 }
  }
  const speed = speedParam ? Number(speedParam) : 0 // default: frozen at ?now
  return { baseVirtual, baseReal: Date.now(), speed: Number.isFinite(speed) ? speed : 0 }
}

/** Compute virtual "now" from a clock config. */
export function currentVirtualTime(cfg: EventClockConfig): Date {
  const elapsed = Date.now() - cfg.baseReal
  return new Date(cfg.baseVirtual.getTime() + elapsed * cfg.speed)
}
```

- [ ] **Step 2: Modify `hooks/useSchedule.ts` to use the event clock**

Replace lines 17-23 (the `now` state and its tick `useEffect`):

```ts
  const [now, setNow] = useState<Date>(() => new Date())

  // Tick every 30 seconds — enough for session boundary detection
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])
```

with:

```ts
  const [clockCfg] = useState(() => parseEventClock())
  const [now, setNow] = useState<Date>(() => currentVirtualTime(clockCfg))

  useEffect(() => {
    // Frozen clock (speed === 0): no tick needed.
    if (clockCfg.speed === 0) return
    // Tick cadence: every 30s for realtime; faster when fast-forwarding so
    // the UI stays ahead of session boundaries at higher speeds.
    const interval = clockCfg.speed >= 10 ? 500 : 30_000
    const id = setInterval(() => setNow(currentVirtualTime(clockCfg)), interval)
    return () => clearInterval(id)
  }, [clockCfg])
```

Add this import at the top of `hooks/useSchedule.ts`:

```ts
import { parseEventClock, currentVirtualTime } from '@/lib/event-clock'
```

- [ ] **Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 4: Manually verify in dev**

Run: `npm run dev`
Open: `http://localhost:3000/?now=2026-04-25T15:00:00%2B03:00`
Expected: Clock component keeps showing real wall time (intentional — it reads its own `new Date()`), but the boarding pass, timeline, and flight status render the Saturday 15:00 state (between Eğitim-4 ending and Sistem Kurmak starting at 15:30).

Open: `http://localhost:3000/?now=2026-04-24T09:00:00%2B03:00&speed=120`
Expected: watch the event play forward — boarding pass transitions through every session in ~36 real minutes.

- [ ] **Step 5: Commit**

```bash
git add lib/event-clock.ts hooks/useSchedule.ts
git commit -m "feat(sms): dev-only event clock for time-injection QA"
```

---

## Task 26: Dev schedule for Layer-3 staging runs

**Files:**
- Create: `schedule.dev.json`

- [ ] **Step 1: Create `schedule.dev.json`**

Replace `<YYYY-MM-DD>` with today's date (Istanbul), and `<HH:MM>+05:00` / etc with times 5, 8, and 11 minutes after the expected publish moment. This file is a staging-only artifact — commit it but expect to rotate its times before each rehearsal.

```jsonc
{
  "event": {
    "name": "DEV — Sapphire SMS Staging",
    "subtitle": "dev",
    "dates": "dev",
    "location": "dev",
    "address": "dev",
    "timezone": "Europe/Istanbul"
  },
  "days": [
    {
      "day": "Dev", "dayEN": "Dev",
      "date": "2026-04-19",
      "sessions": [
        { "start": "20:15", "end": "20:17", "type": "session",
          "title": "Dev Session 1", "smsReminder": true },
        { "start": "20:25", "end": "20:27", "type": "session",
          "title": "Dev Session 2", "smsReminder": true },
        { "start": "20:35", "end": "20:37", "type": "session",
          "title": "Dev Session 3", "smsReminder": true }
      ]
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git add schedule.dev.json
git commit -m "chore(sms): add schedule.dev.json for staging SMS runs"
```

- [ ] **Step 3: Staging rehearsal procedure (manual, not in code)**

On the preview branch:
1. Set env vars on the preview: `USE_DEV_SCHEDULE=true`, all Netgsm + Telegram + admin secrets.
2. Edit `schedule.dev.json` to set the 3 session times ~15 min in the future, commit + push.
3. Wait for deploy, register your phone at the preview URL.
4. Run:
   ```bash
   curl -X POST -H "Authorization: Bearer $ADMIN_SECRET" \
     https://<preview-host>/api/admin/sms/publish-all
   ```
5. Verify `/admin/sms?token=$ADMIN_SECRET` shows 3 × `published` rows.
6. Wait through the 3 session windows; verify 3 texts arrive, status transitions to `delivered`.

---

## Task 27: Test-data cleanup — dump + truncate registrations

**Files:**
- No code files; a one-time operational task executed before go-live.

- [ ] **Step 1: Dump existing 30 rows to local JSON**

Via Supabase MCP:

Call `mcp__supabase__execute_sql` with `query: "select * from public.registrations"`, then save the returned JSON to `registrations_test_backup.json` at the repo root (this path is already gitignored per Task 2).

- [ ] **Step 2: Truncate**

Via Supabase MCP:

Call `mcp__supabase__execute_sql` with `query: "truncate table public.registrations"`.

- [ ] **Step 3: Verify**

Call `mcp__supabase__execute_sql` with `query: "select count(*) from public.registrations"`. Expected: `0`.

- [ ] **Step 4: No commit needed** (backup file is gitignored).

---

## Post-implementation verification (manual)

Work through the full **Setup checklist** in the spec (`docs/superpowers/specs/2026-04-19-sms-reminder-system-design.md` §Setup checklist). Every item must be checked off before go-live.

The critical sequence on April 24 morning:

1. `POST /api/admin/sms/preflight` with operator's phone. Wait ~15 min, confirm arrival within ±1 min.
2. Verify `USE_DEV_SCHEDULE` is unset (or absent) on Production.
3. `POST /api/admin/sms/publish-all`.
4. Open `/admin/sms?token=$ADMIN_SECRET` on operator's phone — every session row should show `published = <N registrants>`, all other columns `0`.
5. Send a test Telegram alert via an insert of a fake `publish_rejected` row, confirm alert fires. Delete the fake row.

If all green → system is live.
