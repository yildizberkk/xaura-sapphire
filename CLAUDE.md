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

For sending SMS via the Netgsm API, use the official Python SDK (`netgsm-sms`).  
Full reference docs (installation, all methods, error codes): [`netgsm-ptyhon-sdk/netgsm-sdk-docs.md`](netgsm-ptyhon-sdk/netgsm-sdk-docs.md)

**Quick reference:**
- Install: `pip install netgsm-sms`
- Init: `Netgsm(username=..., password=..., appname=...)`
- Send: `netgsm.sms.send(msgheader="HEADER", messages=[{"msg": "...", "no": "5XXXXXXXXX"}])`
- Business errors come back as HTTP 406 → `NotAcceptableException` with an `e.code` string
- Env vars: `NETGSM_USERNAME`, `NETGSM_PASSWORD`, `NETGSM_MSGHEADER`, `NETGSM_APPNAME`
