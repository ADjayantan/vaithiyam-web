# வைத்தியம் — Vaithiyam Web

<div align="center">

![Vaithiyam Banner](public/design.html)

**Premium Siddha · Ayurveda · Natural Medicine E-Commerce**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-ready-green?logo=supabase)](https://supabase.com/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

</div>

---

## 📖 About

Vaithiyam is a safety-first traditional medicine e-commerce platform with **Tamil-first** product labels and a premium **Antigravity dark design system**.

- **Siddha · Ayurveda · Natural** medicine catalogue with 24+ demo products
- **Prescription-aware checkout** — Rx-gated products require upload before purchase
- **Tamil + English** bilingual UI throughout
- **Educational only** — no diagnosis, dosage advice, or self-medication recommendations

---

## 🎨 Design System

The UI uses the **Antigravity dark design** with:

| Token | Value |
|---|---|
| Background | `#030C07` (void black) |
| Primary accent | `#3D8A5C` (herb emerald) |
| Gold accent | `#D4890A` (saffron) |
| Display font | Cormorant Garamond (serif) |
| Body font | Outfit (sans-serif) |
| Cards | Glassmorphism (`backdrop-filter: blur`) |

> 🔗 **Design preview**: open `public/design.html` in the browser or visit `http://localhost:3001/design.html`

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.local.example .env.local

# 3. Start dev server
npm run dev -- --port 3001
```

Open **[http://localhost:3001](http://localhost:3001)**

---

## 🔑 Demo Accounts

| Role | Credential | Password |
|---|---|---|
| Customer | Mobile `9876543210` | `demo1234` |
| Admin | Email `admin@vaithiyam.local` | `admin1234` |

---

## 📁 Project Structure

```
vaithiyam-web/
│
├── app/                        # Next.js App Router pages
│   ├── globals.css             # Antigravity dark design system
│   ├── layout.tsx              # Root layout (fonts, metadata)
│   ├── page.tsx                # Home page (→ LandingPage)
│   ├── products/               # Product listing + detail pages
│   ├── cart/                   # Shopping cart
│   ├── checkout/               # Checkout flow
│   ├── prescriptions/          # Rx upload & management
│   ├── scanner/                # Barcode scanner page
│   ├── account/                # User account + orders + wishlist
│   ├── auth/                   # Login, register, OTP verify
│   ├── admin/                  # Admin dashboard (medicines, orders, etc.)
│   ├── order/                  # Order detail
│   ├── orders/                 # Order history
│   └── api/                    # API routes (auth, cart, orders, payments)
│
├── components/                 # Reusable React components
│   ├── layout/                 # CustomerShell, header, footer, bottom nav
│   ├── home/                   # LandingPage, sections (hero, products, why)
│   ├── products/               # ProductCard, ProductGrid, filters
│   ├── ui/                     # Button, Badge, Spinner, Modal, Toast
│   ├── account/                # Profile, address, wishlist components
│   ├── admin/                  # Admin-specific UI components
│   ├── auth/                   # Login/register forms
│   ├── checkout/               # Checkout steps
│   ├── order/                  # Order status, tracking
│   ├── orders/                 # Order list items
│   ├── payment/                # Payment widgets
│   └── wishlist/               # Wishlist page
│
├── lib/                        # Core utilities & data layer
│   ├── medicineData.ts         # 24+ demo medicines & categories seed
│   ├── mockDb.ts               # In-memory mock DB (local fallback)
│   ├── db/                     # Supabase repository layer
│   │   ├── client.ts           # Supabase client initializer
│   │   ├── products.ts         # Product queries
│   │   ├── cart.ts             # Cart operations
│   │   ├── orders.ts           # Order management
│   │   ├── wishlist.ts         # Wishlist queries
│   │   ├── addresses.ts        # User address book
│   │   ├── prescriptions.ts    # Prescription upload/verify
│   │   └── admin.ts            # Admin dashboard queries
│   ├── auth.ts                 # JWT auth helpers
│   ├── adminAuth.ts            # Admin auth guard
│   ├── apiAuth.ts              # API route auth middleware
│   ├── cart.ts                 # Cart business logic
│   ├── order.ts                # Order utilities
│   ├── orderDto.ts             # Order data transfer objects
│   ├── fontawesome.ts          # FontAwesome icon library setup
│   └── payments/               # Razorpay integration scaffold
│
├── hooks/
│   └── useRazorpay.ts          # Razorpay checkout hook
│
├── stores/                     # Zustand global state
│   └── (cart, wishlist, etc.)
│
├── types/
│   └── order.ts                # Shared TypeScript interfaces
│
├── supabase/
│   └── schema.sql              # DB schema for Supabase setup
│
├── public/
│   └── design.html             # Antigravity design preview (static)
│
├── .env.local.example          # Environment variable template
├── next.config.js              # Next.js config
├── tsconfig.json               # TypeScript config
├── eslint.config.mjs           # ESLint config
└── package.json                # Dependencies & scripts
```

---

## 🌐 Routes

### Customer

| Route | Description |
|---|---|
| `/` | Home — hero, featured products, categories |
| `/products` | Full product catalogue with search & filters |
| `/products/[slug]` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Checkout (address, payment) |
| `/prescriptions` | Upload & track prescriptions |
| `/scanner` | Barcode medicine scanner |
| `/account` | Profile & settings |
| `/account/orders` | Order history |
| `/account/wishlist` | Saved products |
| `/auth/login` | Login (mobile OTP) |
| `/auth/register` | New account |
| `/auth/verify-otp` | OTP verification |

### Admin

| Route | Description |
|---|---|
| `/admin/login` | Admin sign-in |
| `/admin/dashboard` | Stats & overview |
| `/admin/medicines` | Add / edit products |
| `/admin/categories` | Category management |
| `/admin/orders` | Order management |
| `/admin/prescriptions` | Verify Rx uploads |
| `/admin/users` | User management |
| `/admin/reports` | Sales reports |
| `/admin/settings` | App settings |

---

## ⚙️ Environment Variables

Copy `.env.local.example` → `.env.local`:

```env
# Supabase (optional — app falls back to mockDb without these)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Auth
JWT_SECRET=

# Razorpay (optional — payment flow is scaffolded)
NEXT_PUBLIC_RAZORPAY_KEY_ID=
RAZORPAY_KEY_SECRET=

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=
```

> **Note:** If Supabase variables are missing, the app automatically falls back to `lib/mockDb.ts` — local development works out of the box without any backend.

---

## 🗄️ Database Setup (Supabase)

1. Create a [Supabase](https://supabase.com) project
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Add credentials to `.env.local`
4. Create a profile row with `role = 'admin'` for admin access

---

## 💳 Payment Setup (Razorpay)

1. Add `NEXT_PUBLIC_RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` to `.env.local`
2. Connect `app/api/payment/` to Razorpay order creation
3. Add webhook verification before marking orders as paid

---

## 🛠️ Scripts

```bash
npm run dev          # Start dev server (port 3000)
npm run dev -- --port 3001   # Start on port 3001
npm run build        # Production build
npm run start        # Start production server
npm run lint         # Run ESLint
```

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| UI | React 19 + TypeScript |
| Styling | Vanilla CSS (Antigravity design system) |
| State | Zustand |
| Backend/DB | Supabase (PostgreSQL) |
| Auth | jose JWT + HTTP-only cookies |
| Payments | Razorpay (scaffolded) |
| Icons | FontAwesome 6 |
| Animation | Framer Motion |
| Fonts | Cormorant Garamond + Outfit (Google Fonts) |

---

## 📝 License

MIT — free to use for personal and commercial projects.

---

<div align="center">
Made with 🌿 for Tamil traditional medicine · வைத்தியம்
</div>
