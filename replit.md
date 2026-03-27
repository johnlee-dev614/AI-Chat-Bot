# AI Character Chat Platform

## Overview

A full-stack AI character chat platform where users can browse AI personas, chat with them, save favorites, and manage their account.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/chat-app)
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: PostgreSQL + Drizzle ORM
- **Auth**: Replit Auth (OpenID Connect with PKCE)
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
│       ├── config/characters.ts  # Character definitions (edit here to add/modify characters)
│       ├── routes/               # API route handlers
│       │   ├── auth.ts           # Replit OIDC auth routes
│       │   ├── characters.ts     # Character listing/detail
│       │   ├── chat.ts           # Chat messages + AI generation
│       │   └── users.ts          # Favorites + account
│       ├── lib/auth.ts           # Session management
│       └── middlewares/authMiddleware.ts
└── chat-app/            # React + Vite frontend
    └── src/
        ├── pages/        # Route pages
        ├── components/   # Shared components
        └── store/        # Zustand state
lib/
├── api-spec/openapi.yaml         # OpenAPI spec (source of truth)
├── api-client-react/             # Generated React Query hooks
├── api-zod/                      # Generated Zod schemas
├── db/src/schema/                # Drizzle DB schema
│   ├── auth.ts                   # users + sessions tables
│   ├── chats.ts                  # messages table
│   └── favorites.ts              # favorites table
└── replit-auth-web/              # Browser auth hook/util
```

## Pages

- `/` — Landing page with hero, character previews, features
- `/characters` — Character directory with search + filter
- `/characters/:slug` — Individual character profile
- `/chat/:character` — Chat interface
- `/login` — Login page
- `/signup` — Signup (redirects to login)
- `/account` — User account page

## Special Features

- **Age gate**: Full-screen gate on first visit stored in localStorage
- **AI disclaimer**: Modal after age confirmation
- **Favorites**: Heart characters, persisted per user
- **Chat history**: Persisted per user per character
- **6 pre-seeded characters**: Luna, Kai, Dr. Serena, Zara, Marco, Nova

## Adding Characters

Edit `artifacts/api-server/src/config/characters.ts` — add a new entry to the `characters` array with a unique `id`, `slug`, `name`, system prompt, etc.

## AI Integration

Chat responses are currently mocked in `artifacts/api-server/src/routes/chat.ts` in the `generateAIResponse` function. Uncomment and configure the OpenAI or Anthropic section to enable real AI responses.

Environment variables needed:
- `OPENAI_API_KEY` — for OpenAI integration
- `DATABASE_URL` — auto-provided by Replit
- `REPL_ID` — auto-provided by Replit

## Running Codegen

After modifying `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Database Migrations

```bash
pnpm --filter @workspace/db run push
```
