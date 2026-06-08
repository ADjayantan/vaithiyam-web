# வைத்தியம் — Vaithiyam

Premium Tamil + English medical-commerce demo built with Next.js 16 App Router, React 19, TypeScript, Zustand, jose JWT auth, Supabase-ready repositories, and a mock fallback data store.

Vaithiyam is safety-first: product pages are educational only. The app does not provide diagnosis, dosage advice, or self-medication recommendations. Products marked prescription-required are gated by prescription upload/pending verification before checkout.

## Quick Start

```bash
npm install
npm run dev -- --port 3001
```

Open [http://localhost:3001](http://localhost:3001).

## Demo Accounts

| Role | Login | Password |
| --- | --- | --- |
| Customer | mobile `9876543210` | `demo1234` |
| Admin | email `admin@vaithiyam.local` | `admin1234` |

## Routes

Customer:
- `/`
- `/products`
- `/products/[slug]`
- `/cart`
- `/checkout`
- `/prescriptions`
- `/scanner`
- `/account`
- `/account/orders`
- `/account/wishlist`
- `/auth/login`
- `/auth/register`
- `/auth/verify-otp`

Admin:
- `/admin/login`
- `/admin/dashboard`
- `/admin/medicines`
- `/admin/categories`
- `/admin/orders`
- `/admin/prescriptions`
- `/admin/users`
- `/admin/reports`
- `/admin/settings`

## Environment

Copy `.env.local.example` to `.env.local` and fill values when moving beyond local demo:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
JWT_SECRET=
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=
NEXT_PUBLIC_ADMIN_EMAIL=
```

If Supabase values are missing, the app falls back to `lib/mockDb.ts` so local development still works.

## Supabase Setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the SQL editor.
3. Add the Supabase URL, anon key, and service role key to `.env.local`.
4. Create a profile row with `role = 'admin'` for admin users.
5. Replace mock repository fallbacks in `lib/db/*` with production Supabase queries as needed.

## Razorpay Setup

The Razorpay flow is scaffolded but not activated without keys.

1. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID`.
2. Add `RAZORPAY_KEY_SECRET`.
3. Connect checkout order creation to Razorpay order/session creation.
4. Add webhook verification before marking paid orders as confirmed.

## Data Layer

- `lib/mockDb.ts` keeps local demo data in memory.
- `lib/medicineData.ts` seeds 24 safe demo medicines and categories.
- `lib/db/client.ts` lazily initializes Supabase clients.
- `lib/db/products.ts`, `cart.ts`, `orders.ts`, `wishlist.ts`, `addresses.ts`, `prescriptions.ts`, and `admin.ts` define Supabase-ready repository boundaries.

## Validation

```bash
npm run lint
npm run build
```

Warnings should be treated as cleanup items. Build must pass before deployment.
