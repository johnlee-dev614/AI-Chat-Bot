# Sonuria — AI Character Chat Platform

## Overview

A full-stack AI companion chat platform. Users browse AI personas, chat with them via OpenRouter (free LLMs), hear responses via ElevenLabs voice synthesis, save favorites, and manage their account. Includes Replit Auth, age gate, AI disclaimer, and 6 pre-seeded characters.

## Theme

**"Midnight Bedroom" aesthetic** — deep warm plum-charcoal background, dusty rose/mauve primary, soft candlelight accent, warm off-white text. Playfair Display (italic serif) for display headings, Lato for body. No neon, no web3 styling. Soft glows, blurred ambiance, rounded surfaces.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (`artifacts/chat-app`)
- **API framework**: Express 5 (`artifacts/api-server`)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Custom email/password auth (bcrypt, server-side sessions)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **State management**: Zustand
- **Animations**: Framer Motion
- **Routing**: Wouter

## Structure

```text
artifacts/
├── api-server/          # Express API server
│   └── src/
│       ├── config/characters.ts  # Character definitions (edit to add/modify)
│       ├── routes/
│       │   ├── auth.ts           # Email/password auth routes (signup, login, logout) — auto-grants 10 Embers on signup
│       │   ├── characters.ts     # Character listing/detail
│       │   ├── chat.ts           # Chat messages + AI (OpenRouter + ElevenLabs) — deducts 1 Ember per message
│       │   ├── users.ts          # Favorites, account, ember balance, claim-starter, profile update, transactions
│       │   └── payments.ts       # Payment placeholder (503) + GET /api/payments/packages
│       ├── lib/auth.ts           # Session management
│       └── middlewares/authMiddleware.ts
└── chat-app/            # React + Vite frontend
    └── src/
        ├── pages/        # Route pages (home, characters, chat, account, settings, help, billing)
        ├── components/   # Shared components
        │   ├── layout/   # Navbar (with Ember balance pill), Footer
        │   ├── paywall/  # EmberPaywallModal
        │   └── shared/   # CharacterCard, AgeGate
        ├── lib/
        │   └── ember-context.tsx  # EmberProvider + useEmbers hook
        ├── index.css     # Theme variables, fonts, utility classes
        └── store/        # Zustand state
lib/
├── api-spec/openapi.yaml         # OpenAPI spec (source of truth)
├── api-client-react/             # Generated React Query hooks
├── api-zod/                      # Generated Zod schemas
├── db/src/schema/                # Drizzle DB schema
└── replit-auth-web/              # Browser auth hook/util
```

## Pages

- `/` — Landing page: hero, featured characters, feature grid
- `/characters` — Character directory with search + category filter
- `/characters/:slug` — Individual character profile
- `/chat/:character` — Chat interface with sidebar, voice toggle, conversation starters
- `/login` — Login page
- `/account` — User account (favorites grid, stats)

## Special Features

- **Age gate + AI disclaimer**: Full-screen gate on first visit, stored in localStorage
- **Optimistic chat UI**: User message appears immediately; `sending → thinking → speaking` status states
- **Retry on error**: Inline retry button when AI response fails
- **Favorites**: Heart characters, persisted per user in DB
- **Chat history**: Persisted per user per character in DB
- **Voice synthesis**: ElevenLabs TTS on AI replies (non-fatal if unavailable)
- **6 pre-seeded characters**: Luna, Kai, Dr. Serena, Zara, Marco, Nova
- **Voice health check**: `GET /api/voice/health`

## Ember Paywall System

Embers are Sonuria's in-app currency. Each message sent costs 1 Ember.

### Economy Rules
- **New account**: 10 Embers granted automatically at signup (`trialUsed = true`)
- **Cost**: 1 Ember per message sent (atomic SQL decrement, floored at 0)
- **Freeze**: Chat input frozen when balance = 0, paywall modal shown
- **Navbar**: Ember balance pill displayed while logged in (amber/rose color when low/empty, clickable to open paywall)

### DB Schema
- `users.embers` (integer, default 0) — current balance
- `users.trial_used` (boolean, default false) — whether starter pack was claimed
- `ember_transactions` — audit log (type: 'credit' | 'debit', amount, description)

### API Endpoints
| Endpoint | Auth | Description |
|---|---|---|
| `GET /api/users/balance` | ✓ | Returns `{ embers, trialUsed }` |
| `POST /api/users/claim-starter` | ✓ | One-time 10-Ember grant (idempotent) |
| `GET /api/payments/packages` | — | Returns purchase packages (Spark/Flame/Inferno) |
| `POST /api/payments/purchase` | ✓ | **Placeholder** — returns 503 until payment provider is wired |

### Frontend Components
- `src/lib/ember-context.tsx` — `EmberProvider` + `useEmbers()` hook (wraps all auth'd routes)
- `src/components/paywall/EmberModal.tsx` — Slide-up paywall modal with package selection
- Chat page: `isEmberless` flag drives frozen input → "Get Embers" CTA banner
- `SendMessageResponse` includes `embers` field — balance updates live after each message

### Connecting a Payment Provider
Replace the stub in `artifacts/api-server/src/routes/payments.ts` with real Stripe/etc integration via Replit environment secrets. On successful purchase, credit `usersTable.embers` and insert an `emberTransactionsTable` record with `type: 'credit'`.

## AI Integration

- **LLM**: OpenRouter with per-model retry loop (`OPENROUTER_MODELS` array in `chat.ts`)
  - Each model has a 12-second AbortController timeout
  - Working models: `openrouter/free` (auto-routes), `google/gemma-3-4b-it:free`
- **TTS**: ElevenLabs `eleven_turbo_v2_5` model, 18-second timeout, non-fatal on failure
- **Logging**: Pino structured logging at every step (use `req.log.info/warn/error`)

### Required Environment Variables

- `OPENROUTER_API_KEY` — OpenRouter LLM API key
- `ELEVENLABS_API_KEY` (or `VOICE_API_KEY`) — ElevenLabs TTS
- `VOICE_ID` — ElevenLabs voice ID
- `DATABASE_URL` — auto-provided by Replit
- `REPL_ID` — auto-provided by Replit

## Zod Schema Notes

- All schemas use `useDates: true` — `date-time` fields must be JS `Date` objects, not ISO strings
- Use `createdAt: new Date()` not `.toISOString()` when calling `.parse()`

## Running Codegen

After modifying `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Database Migrations

```bash
pnpm --filter @workspace/db run push
```
