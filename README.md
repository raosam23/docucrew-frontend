# DocuCrew — Frontend

Next.js web client for **DocuCrew**, a multi-document intelligence platform powered by CrewAI and RAG.

Users register and log in, manage document collections, upload files for ingestion, and chat with a collection. Answers come from the backend Query Crew over **SSE** (`POST .../query/stream`), with live tokens and citation chips.

| Layer | Choice |
| ----- | ------ |
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Package manager | **bun** |
| HTTP | **ky** (`credentials: "include"`) for JSON; native `fetch` for SSE |
| State | Zustand |
| Toasts | notistack |
| Icons | lucide-react |
| Font | Spectral (Google Fonts) |

Auth uses the backend’s **httpOnly** `access_token` cookie. The frontend stores only the user object in Zustand — never a JWT in localStorage or request headers.

---

## What this app does

1. **Auth** — Login and register pages. Register auto-logs in. App layout calls `GET /api/auth/me` and redirects to `/login` on failure.
2. **Dashboard** — Grid of collections (`CollectionCard`) with create and delete.
3. **New collection** — Name, description, multi-file upload. Creates the collection, uploads documents (ingestion can take a while; ky timeout disabled), then redirects to the workspace.
4. **Collection workspace** — Two-panel layout:
   - **Left:** Collection info, add/delete documents, status badges.
   - **Right:** Query history, streaming chat input, live answer tokens, citation chips.
5. **Query gating** — Chat is enabled only when the collection has at least one document and every document is `ready`.

Design system: light mode only, warm sand / amber tokens in `globals.css` (no blue/indigo greys). Use semantic classes (`bg-background`, `text-foreground`, `bg-primary`, etc.).

---

## Folder structure

```
frontend/
├── package.json
├── bun.lock
├── .env.example                   # NEXT_PUBLIC_API_URL
├── components.json                # shadcn config
├── next.config.ts
├── postcss.config.mjs             # Tailwind v4
└── src/
    ├── app/
    │   ├── layout.tsx             # Root layout: Spectral font, Providers
    │   ├── page.tsx               # Redirect / → /dashboard
    │   ├── globals.css            # Tailwind v4 + design tokens
    │   ├── (auth)/
    │   │   ├── login/page.tsx
    │   │   └── register/page.tsx
    │   └── (app)/
    │       ├── layout.tsx         # Auth guard + top navbar + logout
    │       ├── dashboard/page.tsx
    │       └── collections/
    │           ├── new/page.tsx
    │           └── [id]/page.tsx # Workspace: documents + SSE chat
    ├── components/
    │   ├── providers.tsx          # SnackbarProvider + TooltipProvider
    │   ├── collections/
    │   │   └── CollectionCard.tsx
    │   ├── chat/
    │   │   └── QueryThinkingWord.tsx
    │   ├── loading/
    │   │   ├── LoadingState.tsx
    │   │   └── ButtonLoader.tsx
    │   └── ui/                    # shadcn: button, input, card, label, …
    ├── lib/
    │   ├── api.ts                 # ky client → NEXT_PUBLIC_API_URL
    │   ├── constants.ts           # Thinking / streaming button labels
    │   └── utils.ts               # cn()
    ├── stores/
    │   ├── authStore.ts           # user, login, register, logout
    │   └── collectionStore.ts     # collections, docs, history, SSE query
    └── types/
        └── index.ts               # Shared TypeScript types
```

Chat UI lives in `collections/[id]/page.tsx` plus `collectionStore.submitQueryStream`. Dedicated `ChatWindow` / `ChatMessage` / `QueryInput` components are not split out yet.

---

## Routes (pages)

| Path | File | Auth | Description |
| ---- | ---- | ---- | ----------- |
| `/` | `src/app/page.tsx` | — | Redirects to `/dashboard`. |
| `/login` | `(auth)/login/page.tsx` | Public | Email / password → `authStore.login` → `/dashboard`. |
| `/register` | `(auth)/register/page.tsx` | Public | Name / email / password → register then auto-login → `/dashboard`. |
| `/dashboard` | `(app)/dashboard/page.tsx` | Guarded | Lists collections; link to New Collection; delete via card dialog. |
| `/collections/new` | `(app)/collections/new/page.tsx` | Guarded | Create collection + upload PDF/DOCX/TXT/MD → redirect to workspace. |
| `/collections/[id]` | `(app)/collections/[id]/page.tsx` | Guarded | Documents panel + streaming chat (`/query/stream`). |

### Auth guard

`(app)/layout.tsx` is a client layout. On mount it calls `GET /api/auth/me`. On `401` it redirects to `/login` and shows a loading state until the check finishes. The top nav shows brand, user name/email, and Logout (`POST /api/auth/logout`).

There is no Next.js `middleware.ts`; protection is layout-based only.

### Backend APIs the UI calls

| UI action | Backend |
| --------- | ------- |
| Login / register / logout / me | `/api/auth/*` |
| List / create / delete collections | `/api/collections/` |
| Fetch one collection | `/api/collections/{id}` |
| List / upload / delete documents | `/api/collections/{id}/documents` |
| Load chat history | `GET /api/collections/{id}/history` |
| Ask a question (chat) | `POST /api/collections/{id}/query/stream` (SSE) |

JSON calls go through `lib/api.ts` (ky + cookies). Streaming uses `fetch` with `credentials: "include"` and a ReadableStream parser in `collectionStore.submitQueryStream` (ky timeouts are a poor fit for long SSE).

---

## Installation

### Prerequisites

- [bun](https://bun.sh)
- Backend running at the URL you set in env (default `http://localhost:8000`)

### Steps

```bash
cd frontend

bun install

cp .env.example .env.local
```

`.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

Start the dev server:

```bash
bun dev
```

Open [http://localhost:3000](http://localhost:3000).

Other scripts:

```bash
bun run build      # production build
bun run start      # serve production build
bun run lint       # ESLint
bun run lint:fix  # ESLint with --fix
```

Use **bun** for this project (`bun install` / `bun add`), not npm.

### Local full stack

1. Start the backend (`uv run uvicorn app.main:app --reload` in `backend/`).
2. Ensure `ALLOWED_ORIGINS` includes `http://localhost:3000`.
3. Start the frontend with `bun dev`.
4. Register a user, create a collection, upload documents, wait until status is `ready`, then ask questions in the workspace chat.
