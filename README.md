# Verse

A Bible study app built with Next.js (App Router), TypeScript, Tailwind CSS v4 and Supabase.

## Run locally

**Prerequisites:** Node.js 20+

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `GEMINI_API_KEY` (optional, server-only; without it onboarding uses built-in plans and voice journaling falls back to browser speech-to-text)
3. Run the dev server: `npm run dev` (http://localhost:3000)

## Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the dev server on port 3000 |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | Type-check with TypeScript |

## Database

See [supabase/README.md](supabase/README.md) for the migration order.
