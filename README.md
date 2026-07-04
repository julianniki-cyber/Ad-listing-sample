# Doopido

A Pinterest-style classifieds marketplace — browse, post, and discover ads for anything you want
to buy or sell.

- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend:** Supabase (Postgres, Auth, Storage)
- **Payments:** Razorpay, used only to feature/promote a listing

## Getting started

See [SETUP.md](./SETUP.md) for the full step-by-step setup guide, including creating the Supabase
project, running the database schema, and configuring environment variables.

Once your `.env.local` is in place:

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project structure

- `app/` — routes (App Router)
- `components/` — UI, layout, ads, filters, forms, auth, dashboard, and payments components
- `lib/` — Supabase clients, Razorpay client, validation schemas, and query helpers
- `supabase/schema.sql` — full database schema, RLS policies, and seed data
- `types/` — shared TypeScript types
