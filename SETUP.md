# Doopido — Setup Guide

Follow these steps in order. Steps 1–3 are required before the app will run at all; step 4
(Razorpay) can be done later — the app works fine without it and just shows a "payments not
configured" notice on the feature/promote flow.

## 1. Create your Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in (or create an account).
2. Click **New project**. Choose an organization, name it (e.g. `doopido`), set a database
   password (save it somewhere safe), and pick a region close to your users.
3. Wait for the project to finish provisioning (~2 minutes).

## 2. Run the database schema

1. In your Supabase project, open the **SQL Editor** (left sidebar).
2. Click **New query**.
3. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repo, copy its entire contents,
   and paste it into the SQL editor.
4. Click **Run**. This creates every table, index, Row Level Security policy, the public
   `listing-images` storage bucket, and seeds the default categories and feature-plan pricing
   tiers. It's safe to re-run — inserts use `on conflict do nothing`.
5. Confirm it worked: in **Table Editor**, you should see `profiles`, `categories`, `listings`,
   `listing_images`, `feature_plans`, `payments`, and `featured_listings`, with `categories` and
   `feature_plans` already populated.

### Optional but recommended for local testing: disable email confirmation

By default Supabase requires users to click a confirmation link before they can log in. For quick
local testing, go to **Authentication → Providers → Email** and turn off **Confirm email**. Turn
it back on before going live.

## 3. Configure environment variables

1. In your Supabase project, go to **Project Settings → API**. You'll need:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key (click "Reveal") → `SUPABASE_SERVICE_ROLE_KEY` — keep this secret, never
     commit it or expose it to the browser.
2. In this project, copy the example env file:
   ```bash
   cp .env.local.example .env.local
   ```
3. Open `.env.local` and fill in the three Supabase values from step 1. Leave the `RAZORPAY_*`
   variables blank for now (see step 4). `NEXT_PUBLIC_SITE_URL` can stay as
   `http://localhost:3000` for local dev.
4. Install dependencies and run the app:
   ```bash
   npm install
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000). Sign up for an account, post a listing,
   and confirm it shows up on the home page grid.

## 4. Set up Razorpay (for the "feature this ad" payment flow)

This step is optional to start — skip it and come back later. Without it, users can still browse,
post, and manage listings; they just won't be able to pay to feature one yet.

1. Create an account at [razorpay.com](https://razorpay.com) and complete KYC (required before you
   can accept live payments; test mode works immediately without KYC).
2. In the Razorpay Dashboard, switch to **Test Mode** (toggle top-left) while developing.
3. Go to **Settings → API Keys → Generate Test Key**. Copy the **Key ID** and **Key Secret**.
4. In `.env.local`, set:
   ```
   RAZORPAY_KEY_ID=rzp_test_xxxxxxxx
   RAZORPAY_KEY_SECRET=xxxxxxxxxxxxxxxx
   ```
5. Restart `npm run dev`. Go to any of your listings' **Feature** page — you should now see the
   plan picker and a working (test-mode) checkout. Use [Razorpay's test
   cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/) to simulate a
   payment.
6. (Optional, recommended before going live) Set up the webhook safety net: in the Razorpay
   Dashboard go to **Settings → Webhooks → Add New Webhook**, set the URL to
   `https://<your-deployed-domain>/api/razorpay/webhook`, subscribe to `payment.captured` and
   `payment.failed`, and copy the generated **Webhook Secret** into `RAZORPAY_WEBHOOK_SECRET`.
7. When you're ready to accept real payments, generate **Live Mode** keys the same way and swap
   them in for production (see step 6 below for where to set these on Vercel).

## 5. Connect the GitHub repository

This project is already configured to push to
[github.com/julianniki-cyber/Ad-listing-sample](https://github.com/julianniki-cyber/Ad-listing-sample).
To push your work:

```bash
git add -A
git commit -m "Your message"
git push -u origin main
```

If you ever need to re-point the remote:

```bash
git remote set-url origin https://github.com/julianniki-cyber/Ad-listing-sample.git
```

## 6. Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new) and import the `Ad-listing-sample` GitHub repo.
2. In the import screen (or later under **Project Settings → Environment Variables**), add the
   same variables from your `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET` (once you have them)
   - `NEXT_PUBLIC_SITE_URL` → set this to your production URL, e.g. `https://doopido.vercel.app`
3. Click **Deploy**. Vercel will build and host the app; every push to `main` redeploys
   automatically.
4. Update your Razorpay webhook URL (step 4.6) to point at the production domain once deployed.

## Keeping types in sync (optional)

The app currently uses hand-written types in `types/index.ts` that mirror `supabase/schema.sql`.
If you'd like fully generated types instead, install the Supabase CLI and run:

```bash
npx supabase gen types typescript --project-id <your-project-ref> > types/database.types.ts
```

Your project ref is the short ID in your Supabase project URL
(`https://supabase.com/dashboard/project/<project-ref>`).
