# LoveBridge

Marriage visa management system for agencies handling spouse/fiancé visa cases (US, UK, AU, DE, etc.).

Built as a **full-stack PWA** with Next.js 15, Prisma, PostgreSQL, Auth.js, next-intl (ไทย/English) and the LINE Messaging API.

## Features

- Auth (Auth.js credentials, ADMIN/STAFF roles)
- **CRM** — Thai clients + foreign partner profiles, assigned staff
- **Visa cases** — Kanban board + list, status timeline, notes
- **Documents** — Upload per case, required-document checklist per visa type, protected download
- **Invoices & Payments** — dynamic line items, tax, print-friendly A4 view, payment log, auto status update
- **LINE Chat** — LINE Official Account inbox directly inside the CRM; link contacts to clients; send replies
- **i18n** — ไทย / English, locale prefix routing (`/th`, `/en`)
- **PWA** — installable on mobile/desktop, standalone display

## Stack

| Layer | Tech |
|-------|------|
| Framework | Next.js 15 App Router (TypeScript) |
| Database  | PostgreSQL 16 + Prisma |
| Auth      | NextAuth v5 (credentials) |
| UI        | Tailwind CSS + shadcn/ui primitives + lucide-react |
| Forms     | react-hook-form + zod |
| i18n      | next-intl |
| PWA       | next-pwa (service worker, manifest) |
| Messaging | LINE Messaging API (webhook + reply/push) |

## Deploy (try it online)

ดู [DEPLOY.md](./DEPLOY.md) — คู่มือ deploy บน **Vercel + Neon** ใช้เวลา ~10 นาที, ฟรี.

## Getting started (local)

### 1. Boot Postgres

```bash
docker compose up -d
```

### 2. Configure env

```bash
cp .env.example .env
```

Edit `.env` and set:

- `NEXTAUTH_SECRET` — `openssl rand -base64 32`
- `LINE_CHANNEL_SECRET` / `LINE_CHANNEL_ACCESS_TOKEN` — from LINE Developers Console (Messaging API channel)

### 3. Install + migrate

```bash
npm install
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

### 4. Run

```bash
npm run dev
```

Open http://localhost:3000 — auto-redirects to `/th`.

Seed accounts:

| Role | Email | Password |
|------|-------|----------|
| ADMIN | `admin@lovebridge.local` | `admin1234` |
| STAFF | `staff@lovebridge.local` | `staff1234` |

### 5. LINE webhook (optional)

Expose the dev server:

```bash
ngrok http 3000
```

In the LINE Developers Console → Messaging API channel:

- **Webhook URL** → `https://<your-ngrok>.ngrok-free.app/api/line/webhook`
- Enable "Use webhook"
- Turn off "Auto-reply messages"

Send a message from your LINE account to the OA — it will appear in `/th/chat`.

## Project structure

```
app/
  [locale]/
    (auth)/login            # login page
    (dashboard)/            # protected app shell
      page.tsx              # dashboard
      clients/              # CRM
      cases/                # visa cases + board
      invoices/             # invoices + payments
      chat/                 # LINE chat inbox
      settings/             # team / profile
  api/
    auth/[...nextauth]      # NextAuth handler
    uploads/[...path]       # protected file download
    line/webhook            # LINE Messaging webhook
components/
  ui/                       # shadcn primitives
  nav/                      # sidebar, topbar, locale switcher
  clients/, cases/, documents/, invoices/, chat/
lib/
  prisma.ts auth.ts storage.ts line.ts
  visa-requirements.ts case-numbers.ts validators.ts utils.ts
  actions/                  # server actions per feature
messages/th.json, messages/en.json
prisma/schema.prisma, prisma/seed.ts
public/manifest.webmanifest, public/icons/
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build (generates service worker) |
| `npm run start` | Start production server |
| `npm run lint` | ESLint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run db:migrate` | Prisma migrate dev |
| `npm run db:seed` | Seed admin + sample data |
| `npm run db:studio` | Prisma Studio |

## Notes

- Uploaded files are stored under `./uploads/` (gitignored). Swap `lib/storage.ts` to hook up S3/R2 for production.
- The PWA service worker is **disabled in development** — run `npm run build && npm run start` to test it.
- The LINE webhook requires a public HTTPS URL (ngrok for local testing).
- Kanban drag-and-drop updates case status via server action; each move adds a `STATUS_CHANGE` activity.
