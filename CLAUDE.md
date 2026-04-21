# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

**Sapphire Momentum II** — An event experience website for a 3-day leadership event (April 24–26, 2026) at Kremlin Palace, Antalya, organized by Xaura Global. Attendees access the site by scanning QR codes at the venue. The site is in Turkish.

## Source Materials

All assets are in `website_materials_given/`:
- `gilroy/` — Gilroy font family TTF files
- SVG logos: xaura logo, Sapphire Momentum 2 wordmark (light + dark), x2 mark, date text, composition mark
- `schedule.jpeg` — event poster image

## Schedule Data

`schedule.json` at repo root is the source of truth for the event schedule. Structure:

- Top-level `event` object with name, subtitle, dates, location
- `days` array — 3 days (Cuma/Cumartesi/Pazar), each with a `date` (YYYY-MM-DD) and `sessions` array
- Each session has `start`/`end` (`"HH:MM"` or `null`), `title`, optional `titleEN`, optional `subtitle`, and `type`
- Session types: `general`, `meal`, `session`, `keynote`, `entertainment`, `ceremony`, `break`

## SMS Integration (Netgsm)

The app uses a TypeScript `fetch` client at [`lib/netgsm.ts`](lib/netgsm.ts) posting to `/sms/rest/v2/send` — the Python SDK docs in [`netgsm-ptyhon-sdk/`](netgsm-ptyhon-sdk/) are reference only, not used at runtime.

- Env vars: `NETGSM_USERNAME`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER`, `NETGSM_APPNAME`
- **Gotcha:** code `"00"` means "request accepted for dispatch" — *not* delivered. The `jobid` returned on `"00"` is persisted to `registrations.sms_jobid`; query Netgsm's delivery report (panel → "SMS Gönderim Raporu" or `/sms/report`) to confirm actual handset delivery.
- Welcome SMS is sent from the [`registerUser`](app/actions/register.ts) server action on form submit.

## Database (Supabase)

`public.registrations` holds user signups + SMS send status (`sms_successful`, `sms_api_return_code`, `sms_jobid`). `registrations.consent` (bool, default true) gates reminder sends — only rows with `consent=true` receive reminders.
`public.scheduled_messages` — one row per session per SMS reminder batch; upserted on publish.
`public.message_sends` — one row per (scheduled_message × registration); status state machine: `pending → sending → published/publish_rejected → delivered/failed/retry_published/skipped_too_late/canceled`.
No local migration files — schema changes go through `mcp__supabase__apply_migration`. No `supabase/` directory in repo.

## SMS Reminder System

`lib/sms-reminders-*.ts` — core reminder pipeline:
- `sms-reminders-types.ts` — shared types (`ScheduledMessageRow`, `MessageSendRow`, `MessageSendStatus`)
- `sms-reminders-template.ts` — resolves per-session message body; `sms-templates.ts` holds the actual Turkish copy
- `sms-reminders-publish.ts` — `publishPendingReminders()` upserts rows + sends via Netgsm; concurrency capped at 50
- `sms-reminders-reconcile.ts` — queries Netgsm delivery reports and updates `message_sends` status
- `schedule-loader.ts` — loads `schedule.json`; set `USE_DEV_SCHEDULE=true` to load `schedule.dev.json` instead (preview env only)
- `schedule-time.ts` — Istanbul-TZ time helpers; all reminder timestamps stored as UTC ISO strings

**Cron:** `vercel.json` runs `/api/cron/sms-watchdog` every 5 min — do NOT move this to `vercel.ts` (broke deploys).

**Admin panel:** `/admin/sms` — protected by `ADMIN_SECRET` bearer token (or `?token=` query param). Endpoints under `/api/admin/sms/`: `status`, `publish-all`, `cancel`, `killswitch`, `resend`, `preflight`. Use `requireAdminAuth()` from `lib/admin-auth.ts` at the top of every admin route.

**Telegram alerting:** `lib/telegram.ts` — `alertOps(severity, summary, details?)` sends to ops channel; never throws. Env vars: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.

## Additional Env Vars

- `ADMIN_SECRET` — bearer token for all `/api/admin/*` routes
- `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — Telegram ops alerts
- `USE_DEV_SCHEDULE=true` — load `schedule.dev.json` instead of `schedule.json` (preview only)

## Dev/QA Time Travel

`lib/event-clock.ts` — dev-only client-side time injection. Add `?now=2026-04-24T10:00:00&speed=60` to any page URL to fast-forward the event clock. Disabled in production (`NODE_ENV=production`).

## Quotes

`lib/quotes.json` — 100 Turkish motivational quotes displayed randomly between the boarding pass and countdown sections on `client-page.tsx`.
