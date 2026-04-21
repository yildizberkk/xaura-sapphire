# SMS Reminder System — Design Spec
**Date:** 2026-04-19
**Event:** Sapphire Momentum II · 24–26 Nisan 2026 · Kremlin Palace, Antalya
**Scope:** Pre-session SMS reminders sent T-10 min before every content session, to every registrant, across a dynamic registration list that keeps growing during the event.

---

## Overview

Attendees register on the site (phone + name, existing flow in `app/actions/register.ts`). During the 3-day event we want every registrant to receive an SMS **10 minutes before every non-transparent session starts** (all session types except `meal` and `break`, with explicit exclusions for "Giriş" and "Kapı Açılış").

Netgsm supports native **scheduled send** via a `startdate="ddMMyyyyHHmm"` parameter. Rather than build our own high-frequency scheduler, we hand Netgsm the full per-user reminder schedule in advance and let Netgsm fire each message at its `startdate`. Our system's responsibilities are:

1. **Publish** — compute the per-user × per-session reminder plan and push it to Netgsm.
2. **Track** — store every returned `jobid` so we can reconcile.
3. **Reconcile** — poll Netgsm delivery reports after each reminder fires and retry failures once.
4. **Alert** — push a Telegram message to operators when a send fails terminally.
5. **Admin** — provide a small set of HTTP endpoints + a single status page for live troubleshooting.

### Key design principle

**Netgsm is the oven, we are the prep kitchen.** Delivery timing is owned by Netgsm's scheduler, not ours. Our cron runs every 5 minutes only to publish gaps (new registrations) and reconcile outcomes — it is *not* on the critical delivery path.

### Non-goals

- Not building our own per-minute send scheduler (Netgsm handles it).
- Not building a full admin UI (endpoints + one status page only).
- Not changing client-side schedule rendering (already works correctly).
- Not modifying the existing welcome-SMS flow beyond hooking the reminder publish after it.
- Not localizing reminders (Turkish-only per explicit decision).

---

## Session selection

**Non-transparent session types:** `session`, `keynote`, `entertainment`, `ceremony`, `general`.
(The UI renders `meal` and `break` with a transparent dot — those never receive a reminder.)

**Per-session override:** new field in `schedule.json`:

```jsonc
{
  "start": "10:00", "end": "12:30", "type": "general",
  "title": "Giriş",
  "smsReminder": false    // opt-out; default is true
}
```

**Initial overrides (set `smsReminder: false`):**
- Friday 10:00 "Giriş" (arrival window — people are already on their way)
- Friday 20:30 "Kapı Açılış" (doors open — not a scheduled session)

**Sessions that physically cannot be scheduled:** any session with `start: null` (e.g. Saturday's `"Akşam Yemeği"`) is skipped silently — no reminder possible.

**Resulting session list (13 sessions across 3 days):**

| Date       | Start | Type          | Title                                                  |
|------------|-------|---------------|--------------------------------------------------------|
| 2026-04-24 | 16:15 | session       | Ruby Okulu                                             |
| 2026-04-24 | 20:45 | keynote       | 2. Yıl Dönümü Açılış Konuşması                         |
| 2026-04-24 | 21:15 | entertainment | Konser                                                 |
| 2026-04-25 | 09:30 | session       | Eğitim - 1                                             |
| 2026-04-25 | 10:30 | session       | Eğitim - 2                                             |
| 2026-04-25 | 11:30 | session       | Eğitim - 3                                             |
| 2026-04-25 | 13:45 | session       | Eğitim - 4                                             |
| 2026-04-25 | 15:30 | session       | Sistem Kurmak: Sen Olmadan Çalışan Organizasyon        |
| 2026-04-25 | 18:00 | session       | Vizyon Liderliği                                       |
| 2026-04-25 | 21:00 | ceremony      | Takdir Töreni                                          |
| 2026-04-26 | 09:45 | session       | Eğitim - 1                                             |
| 2026-04-26 | 10:45 | session       | Eğitim - 2                                             |
| 2026-04-26 | 13:15 | keynote       | Kapanış Konuşması                                      |

---

## Timezone handling

The event runs in **Europe/Istanbul (UTC+3, no DST)**. Vercel functions run in UTC. Mishandling this offset would shift every reminder by 3 hours.

### Approach — explicit Istanbul anchoring in server code only

1. Add `"event.timezone": "Europe/Istanbul"` to `schedule.json`.
2. New server-only helper `lib/schedule-time.ts`:
   - `sessionStartUtc(day, session) → Date` — takes schedule `date` + `start` strings, treats them as Istanbul wall-clock, returns a UTC `Date`.
   - `reminderAtUtc(day, session) → Date` — `sessionStartUtc` minus 10 minutes.
   - `formatNetgsmStartdate(d: Date) → string` — converts a UTC `Date` back to Istanbul wall-clock in `ddMMyyyyHHmm` format for Netgsm.
3. Client-side rendering is **not** modified. It already works correctly because attendees' phones are on TRT.

### Pre-flight verification (day of event)

Before the real publish, send **one** scheduled SMS to the operator's phone with `startdate` 15 minutes in the future. If it arrives within ±1 minute of the expected moment, the TZ pipeline is verified end-to-end. This check is **non-negotiable** — the cost of TZ being wrong on 400+ texts is higher than any other bug this system can have.

---

## Message template

**Language:** Turkish only (all registrants receive the TR message regardless of their detected browser locale).

**Encoding:** GSM-7 + Turkish shift table (Netgsm's `encoding: 'tr'` flag). 1 segment per message, hard-capped at 160 characters. Per-session overrides that exceed 160 chars fail a CI lint.

**Default template (resolved per send):**

```
Sevgili {name}, {session} birazdan başlıyor. Görüşmek üzere.
```

- `{name}` — `registrations.first_name` (not full name).
- `{session}` — `scheduled_messages.session_title` (snapshot at publish time).

Worst-case substitution (longest session title "Sistem Kurmak: Sen Olmadan Çalışan Organizasyon", 47 chars, plus typical first name) resolves to ~130 chars — comfortably 1 segment.

**Optional per-session override:** new field `smsMessage?: string` in `schedule.json`. Falls back to the default template when absent.

```jsonc
{
  "start": "21:00", "type": "ceremony",
  "title": "Takdir Töreni",
  "smsMessage": "Sevgili {name}, Takdir Töreni birazdan başlıyor. Sahneyle gurur duy."
}
```

---

## Data model

### Schema changes

No column additions on `registrations`. Two new tables plus one single-row config table:

```sql
create table public.scheduled_messages (
  id               uuid primary key default gen_random_uuid(),
  day_idx          int  not null,
  session_idx      int  not null,
  session_title    text not null,              -- snapshot at publish time
  session_start_at timestamptz not null,       -- UTC instant of session start
  reminder_at      timestamptz not null,       -- session_start_at - 10 min
  message_body     text not null,              -- resolved template, TR, ≤ 160 chars
  created_at       timestamptz not null default now(),
  unique (day_idx, session_idx)
);
create index on scheduled_messages (reminder_at);

create table public.message_sends (
  id                   uuid primary key default gen_random_uuid(),
  scheduled_message_id uuid not null references scheduled_messages(id) on delete cascade,
  registration_id      uuid references registrations(id) on delete set null,
  phone_snapshot       text not null,                           -- e164 at publish time
  status               text not null default 'pending',
  netgsm_jobid         text,
  netgsm_return_code   text,
  published_at         timestamptz,
  delivered_at         timestamptz,
  retry_count          int not null default 0,
  last_error           text,
  last_checked_at      timestamptz,
  alerted_at           timestamptz,                             -- set when Telegram alert fired
  created_at           timestamptz not null default now(),
  unique (scheduled_message_id, registration_id)
);
create index on message_sends (status, last_checked_at);
create index on message_sends (scheduled_message_id);

create table public.sms_config (
  id           int primary key default 1 check (id = 1),      -- single row
  killswitch   boolean not null default false,
  updated_at   timestamptz not null default now()
);
insert into sms_config (id) values (1) on conflict do nothing;
```

All migrations applied via `mcp__supabase__apply_migration` (project convention — no local migration files).

### Status state machine

```
pending          → published          → delivered             (happy path)
                                      → failed  → retry_published → delivered   (1 retry succeeded)
                                      → failed  → retry_published → failed      (terminal, alert)
                 → publish_rejected                                              (Netgsm rejected on publish, terminal, alert)
                 → skipped_too_late                                              (registered < 2 min before reminder, logged)
                 → canceled                                                      (admin canceled)
```

### Test-data cleanup

Before going live:
1. Dump current 30 rows in `public.registrations` to `registrations_test_backup.json` (gitignored).
2. `truncate public.registrations`.

No `is_test` column is needed in production. For staging, a separate preview deployment with its own env vars isolates test traffic.

---

## Publish flow

Core function: `publishPendingReminders(scope)`.

**Scopes:**
- `{ registrationId: uuid }` — catch-up for one user (called inline from the registration action).
- `{ sessionKey: { day_idx, session_idx } }` — publish all users for one session (admin).
- `'all'` — full sweep (called by watchdog cron and `/admin/sms/publish-all`).

**Pseudocode:**

```
1. If sms_config.killswitch === true: log and return early.

2. Ensure scheduled_messages rows exist for every session in schedule.json where
   smsReminder !== false AND session.start is not null.
   For missing rows: insert {day_idx, session_idx, session_title, session_start_at,
   reminder_at, message_body (resolved from smsMessage override or generic template)}.

3. Load candidate registrations (scope-filtered).

4. For each (scheduled_message × registration) pair where:
     - no message_sends row exists, AND
     - scheduled_messages.reminder_at > now() + 2 minutes
   insert a message_sends row with status='pending' and phone_snapshot=registration.phone.

5. For each status='pending' row:
     a. Resolve final message (interpolate {name}=first_name, {session}=session_title
        into message_body).
     b. Extract national number from phone_snapshot via normalizePhone() in lib/phone.ts.
        If invalid: status='publish_rejected', return_code='INVALID_PHONE'. Skip to next.
     c. Build Netgsm payload: { msgheader, messages: [{msg, no: phone_national}],
                                encoding: 'tr', iysfilter: '0',
                                startdate: formatNetgsmStartdate(reminder_at) }.
     d. POST to /sms/rest/v2/send.
     e. On code="00": status='published', store jobid + published_at.
        On any other code: status='publish_rejected', store return_code + last_error.
        On network/timeout: leave as 'pending' (next watchdog tick retries).

6. For each row where reminder_at <= now() + 2 minutes AND status='pending':
     status='skipped_too_late'.

7. Return summary {inserted, published, publish_rejected, skipped_too_late}.
```

**Idempotency:** the `unique (scheduled_message_id, registration_id)` constraint makes step 4 safe to run concurrently from inline registration and watchdog paths — only one insert wins.

### Inline registration hook

In `app/actions/register.ts`, after the welcome-SMS block and the `registrations` insert:

```ts
try {
  await publishPendingReminders({ registrationId: newRegistration.id });
} catch (err) {
  console.error('inline reminder publish failed', err);
  // Deliberately swallowed — watchdog will catch up on the next 5-min tick.
}
```

The registration action returns success even if the inline publish fails; the watchdog provides eventual consistency.

---

## Watchdog flow — `GET /api/cron/sms-watchdog`

Runs every 5 minutes via `vercel.ts` cron config.

```
1. Call publishPendingReminders('all').
   - Catches new registrations.
   - Catches any 'pending' rows left over from transient publish failures.

2. Reconcile delivered/failed:
   Select message_sends where status='published' AND reminder_at < now() - 3 minutes
   AND (last_checked_at IS NULL OR last_checked_at < now() - 5 minutes).
   Batch by jobid, call Netgsm delivery-report endpoint.
   Update status='delivered' or 'failed' per report.
   Set last_checked_at = now().

3. Retry failed sends (once, only while still useful):
   Select message_sends where status='failed' AND retry_count=0
     AND session_start_at > now() - 5 minutes.
   (Rationale: retrying more than 5 min after the session has started is pointless —
   the reminder is no longer relevant. Rows past this window stay 'failed' and alert.)
   For each: call Netgsm immediate-send (no startdate). On accept:
     status='retry_published', retry_count=1, published_at=now().
   On reject: status stays 'failed' (reconciled on next tick).

4. Alert:
   Select message_sends where alerted_at IS NULL AND status IN
     ('publish_rejected', 'failed' with retry_count >= 1)
   OR where status='pending' AND reminder_at < now() - 5 minutes (missed publish window).
   For each: call alertOps() with row details, set alerted_at = now().
```

**Vercel config (`vercel.ts`):**

```ts
import { type VercelConfig } from '@vercel/config/v1';

export const config: VercelConfig = {
  framework: 'nextjs',
  crons: [
    { path: '/api/cron/sms-watchdog', schedule: '*/5 * * * *' },
  ],
};
```

**Note on cron frequency:** Vercel Hobby plans can restrict to hourly. Setup checklist verifies the project's plan supports `*/5`.

---

## Alerting

New module `lib/telegram.ts`:

```ts
export type Severity = 'info' | 'warn' | 'error';

export async function alertOps(
  severity: Severity,
  summary: string,
  details?: Record<string, unknown>
): Promise<void>;
```

Posts to the Telegram Bot API `sendMessage` endpoint using `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` env vars. Silent no-op (with `console.warn`) if envs are missing — alerting must never crash the watchdog.

**Alert format:**

```
[SMS ALERT · error]
publish_rejected — Eğitim - 2 (Sat 10:30)
registration: 8e4d…c9
return_code: 40
last_error: Message header not defined in system
```

---

## Admin endpoints

All routes under `/api/admin/sms/`. Auth: single bearer token in `ADMIN_SECRET` env var.

| Method | Path                                         | Purpose                                                                           |
|--------|----------------------------------------------|-----------------------------------------------------------------------------------|
| GET    | `/status`                                    | JSON summary: per-session counts `{pending, published, delivered, failed, publish_rejected, skipped_too_late, canceled}`. |
| POST   | `/publish-all`                               | Calls `publishPendingReminders('all')`. Returns summary.                          |
| POST   | `/cancel?scheduled_message_id=…`             | Netgsm cancel-by-jobid for every `message_sends` row under that session. Status → `canceled`. |
| POST   | `/resend?message_send_id=…`                  | Immediate-send via Netgsm for one specific row.                                   |
| POST   | `/killswitch` (body: `{on: boolean}`)        | Flips `sms_config.killswitch`. When on, publish + watchdog both no-op.            |
| POST   | `/preflight` (body: `{phone: string}`)       | Layer-4 TZ verification. Sends one scheduled SMS 15 min out, returns `{jobid, startdate, expectedArrivalUtc}`. |

### Status page

Single React Server Component at `app/admin/sms/page.tsx`. Requires the bearer token in a query param or `Authorization` header (checked server-side). Renders:

- One table row per session (13 rows).
- Columns: session title, time, pending, published, delivered, failed, publish_rejected, canceled.
- Traffic-light coloring: green if all delivered, yellow if any pending/published not yet delivered, red if any failed / publish_rejected.
- Inline curl snippets for each admin action below the table.
- No mutations from the page — everything is a copy-paste curl. This intentionally keeps the page safe to open on a phone at 2 AM.

---

## Testing plan

### Layer 1 — Time injection (dev-only)

New `lib/event-clock.ts` exporting:
- `useEventClock(): Date` — client hook.
- `getServerEventClock(request?: Request): Date` — server-side.

In development (`NODE_ENV !== 'production'`), both read `?now=<ISO>` and optional `?speed=<N>` from the URL. In production both return `new Date()` unconditionally — no code path allows override in prod.

The single top-level `new Date()` call in `app/client-page.tsx` is replaced with `useEventClock()`. All downstream helpers (`classifySessions(day, now)`, `getCurrentSegment(days, now)`, `getFlightStatus(day, sessions, now)`, `getNextSessionDeadline(days, now)`) already take `now` as a parameter — zero additional changes.

**Usage during pre-event QA:**
- `http://localhost:3000/?now=2026-04-25T15:00:00+03:00` — freeze clock at Sat 15:00 TRT.
- `http://localhost:3000/?now=2026-04-24T09:00:00+03:00&speed=60` — play the full event forward at 60× realtime (72 event hours in 72 real minutes).

### Layer 3 — Staging SMS dry-run

New `schedule.dev.json` with 3 sessions spaced 3 minutes apart, starting 5 minutes after publish time. On preview deployments only, env var `USE_DEV_SCHEDULE=true` makes the publish job read `schedule.dev.json` instead of `schedule.json`.

**Procedure:**
1. Deploy preview URL with `USE_DEV_SCHEDULE=true`.
2. Register operator's phone on the preview URL.
3. Hit `POST /api/admin/sms/publish-all`.
4. Wait ~20 minutes.
5. Verify 3 SMS arrive on-time, `/admin/sms` shows 3× `delivered`.

Run at least once 3 days before the event, and once 1 day before.

### Layer 4 — Live pre-flight (morning of April 24)

Before publishing the real schedule, use a dedicated admin endpoint:

1. `POST /api/admin/sms/preflight` with body `{phone: "+90…"}`. The endpoint sends one scheduled SMS to that number with `startdate = now + 15 min` and returns the `jobid` + computed `startdate` string so the operator can visually verify the TZ conversion.
2. Verify SMS arrives within ±1 minute of the expected moment.
3. Only then call `POST /api/admin/sms/publish-all` with the real schedule.

This endpoint is added to the admin route list (see §Admin endpoints).

---

## Setup checklist

Run through before the event.

- [ ] **Telegram bot:** create via @BotFather, get bot token, create a group chat, add the bot, fetch `chat_id`. Put into `TELEGRAM_BOT_TOKEN` + `TELEGRAM_CHAT_ID` Vercel env vars (Production + Preview).
- [ ] **Admin secret:** generate a 32-char random token. Put into `ADMIN_SECRET` (Production + Preview).
- [ ] **Netgsm envs verified in Production:** `NETGSM_USERNAME`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER`, `NETGSM_APPNAME` present per `lib/netgsm.ts`. Verify with `vercel env ls`.
- [ ] **DB migration applied:** `scheduled_messages`, `message_sends`, `sms_config` tables created via Supabase MCP.
- [ ] **Test data cleared:** dump 30 existing `registrations` rows to `registrations_test_backup.json` (gitignored), truncate table.
- [ ] **schedule.json updated:** `event.timezone: "Europe/Istanbul"` added; `smsReminder: false` added to Friday "Giriş" and "Kapı Açılış".
- [ ] **Cron frequency verified:** confirm Vercel plan supports `*/5 * * * *`.
- [ ] **Layer 3 rehearsal passed:** staging SMS run succeeded end-to-end with 3 dev sessions.
- [ ] **Layer 4 pre-flight passed:** morning of April 24, one scheduled SMS to operator's phone 15 min out, arrived within ±1 min.
- [ ] **Publish real schedule:** `POST /api/admin/sms/publish-all` with `USE_DEV_SCHEDULE` unset. Verify `/admin/sms` shows all 13 sessions × N registrants published.
- [ ] **Alerts smoke test:** manually insert a `publish_rejected` row, confirm Telegram alert fires.

---

## Risk register

- **Registrations inside the 2-minute cutoff (`skipped_too_late`):** if a user registers less than 2 minutes before a reminder is due to fire, that one reminder is skipped for that user. All later reminders still fire normally. This is an intentional safety bound to avoid racing Netgsm's scheduler. Visible in `/admin/sms` as a `skipped_too_late` count.
- **Netgsm scheduler accuracy:** we assume ±1 min. Layer 4 pre-flight verifies before go-live.
- **Phone number changes mid-event:** not auto-handled (watchdog-B per design). If a user edits their phone after publish, scheduled SMS still goes to the old number. Operator can manually resend via `/api/admin/sms/resend`.
- **Supabase / Netgsm outage during publish:** inline publish fails silently; watchdog retries every 5 min. Prolonged Netgsm outage near a T-10 window raises alerts.
- **Vercel cron skip:** if a cron tick is skipped, next tick catches up. 5-min interval means worst-case catch-up delay is 5 min, still before most reminders' T-10 windows.

---

## File inventory (what gets created / modified)

### New files

- `lib/schedule-time.ts` — Istanbul-anchored date helpers.
- `lib/event-clock.ts` — dev-only time injection hook.
- `lib/telegram.ts` — Telegram alerting.
- `lib/sms-reminders.ts` — `publishPendingReminders`, `reconcileDeliveryReports`, message resolution.
- `app/api/cron/sms-watchdog/route.ts` — 5-min watchdog endpoint.
- `app/api/admin/sms/status/route.ts`
- `app/api/admin/sms/publish-all/route.ts`
- `app/api/admin/sms/cancel/route.ts`
- `app/api/admin/sms/resend/route.ts`
- `app/api/admin/sms/killswitch/route.ts`
- `app/api/admin/sms/preflight/route.ts`
- `app/admin/sms/page.tsx` — status page.
- `schedule.dev.json` — dev/staging schedule with 3 sessions 3 min apart.
- `vercel.ts` — cron configuration.

### Modified files

- `schedule.json` — add `event.timezone`, add `smsReminder: false` to Giriş + Kapı Açılış.
- `lib/schedule.ts` — extend `RawSession` / `ScheduleData` types for `smsReminder`, `smsMessage`, `event.timezone`.
- `lib/netgsm.ts` — add `sendScheduledSms`, `sendImmediateSms`, `cancelScheduledSms`, `getDeliveryReport` functions (share auth/error handling with existing `sendWelcomeSms`).
- `app/actions/register.ts` — call `publishPendingReminders({ registrationId })` after welcome SMS.
- `app/client-page.tsx` — replace the top-level `new Date()` with `useEventClock()`.
- `.gitignore` — add `registrations_test_backup.json`.

### Supabase (via MCP)

- New migrations for `scheduled_messages`, `message_sends`, `sms_config` tables.
