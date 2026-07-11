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
3. Open [`supabase/schema.sql`](./supabase/schema.sql) from this repo, copy its **entire** contents
   (both the Phase 1 and Phase 2 sections — it's one file), and paste it into the SQL editor.
4. Click **Run**. This creates every table, index, Row Level Security policy, RPC function, the
   `listing-images` and `seller-documents` storage buckets, and seeds the default categories,
   feature-plan pricing, and credit-pack pricing. **The whole file is safe to run more than once**
   — every statement is idempotent (`if not exists`, `create or replace`, or an explicit
   `drop ... if exists` before recreating), so if you already ran an earlier version of this file,
   just re-paste and re-run the current one to pick up new tables/policies.
5. Confirm it worked: in **Table Editor**, you should see `profiles`, `categories`, `listings`,
   `listing_images`, `feature_plans`, `payments`, `featured_listings`, `need_posts`, `bids`,
   `credit_packs`, `credit_payments`, `credit_ledger`, `seller_credits`, `seller_verifications`,
   `profile_private`, and `reviews`, with `categories`, `feature_plans`, and `credit_packs` already
   populated with rows.

### Enable phone (OTP) sign-in

Doopido's primary login is a mobile-number one-time code, not a password. Supabase needs an SMS
provider configured to actually send the code:

1. Go to **Authentication → Providers → Phone** and toggle it **on**.
2. Pick an SMS provider (Twilio is the most common — sign up at
   [twilio.com](https://www.twilio.com), grab a phone number, and copy your Account SID, Auth
   Token, and Messaging Service SID/from-number into the fields Supabase shows for the Twilio
   option). MessageBird, Vonage, and TextLocal are also supported if you prefer one of those.
3. For local development without spending on real SMS, scroll to **Test OTPs** on that same page
   and add a test phone number with a fixed code (e.g. `+911234567890` → `123456`) — logging in
   with that number always accepts that code, no real SMS sent.
4. Leave **Authentication → Providers → Email** enabled too — some early accounts signed up with
   email/password before this change and still need it to log in (see `components/auth/LoginForm`'s
   "Have an existing email login?" option, and the phone-linking prompt shown to those accounts
   once they're in the dashboard).

### Optional but recommended for local testing: disable email confirmation

By default Supabase requires users to click a confirmation link before they can log in with email.
For quick local testing, go to **Authentication → Providers → Email** and turn off **Confirm
email**. Turn it back on before going live.

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

The same keys also power sellers buying credit packs (**Dashboard → Credits**) — no separate setup
needed; it shares the create-order/verify/webhook routes and Razorpay account.

## Verifying sellers (Aadhaar review)

When a seller signs up, they upload an Aadhaar photo to a private Storage bucket
(`seller-documents`) — nobody but that seller and you (via the dashboard) can read it; there's no
automated ID-check API wired up. To verify a seller and show their "Verified" badge:

1. In Supabase, go to **Storage → seller-documents** and open `<their-user-id>/...` to view the
   file.
2. In **Table Editor → seller_verifications**, find their row (by `profile_id`) and set
   `is_verified` to `true`.

There's no in-app admin screen for this yet — it's a manual step per seller for now.

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
