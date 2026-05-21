# TPAPOS — Build Phases

## Phase 1 — Foundation
**Goal:** Project scaffolded, dark design system applied, env files created, database connected, Redis cache configured, multi-tenant auth working, role-based layouts built.

### Tasks
- [ ] Initialize Next.js 16 + shadcn/ui in ONE step: `pnpm dlx shadcn@latest init --preset b0 --template next`. **Do NOT use `--src-dir`** — flat root layout required (`app/`, `components/`, `lib/` at project root, no `src/` wrapper). If falling back to `pnpm create next-app`, pass `--no-src-dir`.
- [ ] Confirm `tsconfig.json` has `"paths": { "@/*": ["./*"] }` (NOT `["./src/*"]`).
- [ ] Install Form shadcn fallback: `pnpm dlx shadcn@latest add https://vibekit.desishub.com/r/form.json`
- [ ] Install Plus Jakarta Sans font via `next/font/google` in root layout
- [ ] Create `.env.example` (committed) and `.env.local` (gitignored) with ALL env vars:
  ```
  # Database
  DATABASE_URL=                  # Neon PostgreSQL connection string
  
  # Redis
  UPSTASH_REDIS_REST_URL=        # Upstash Redis REST URL
  UPSTASH_REDIS_REST_TOKEN=      # Upstash Redis REST token
  
  # Better Auth
  BETTER_AUTH_SECRET=            # Random 32-char secret
  BETTER_AUTH_URL=               # e.g. http://localhost:3000
  
  # Resend
  RESEND_API_KEY=                # From resend.com dashboard
  RESEND_FROM_EMAIL=             # e.g. noreply@TPAPOS.co.ug
  
  # Cloudflare R2
  R2_ACCOUNT_ID=                 # Cloudflare account ID
  R2_ACCESS_KEY_ID=              # R2 access key
  R2_SECRET_ACCESS_KEY=          # R2 secret key
  R2_BUCKET_NAME=                # e.g. TPAPOS-uploads
  R2_PUBLIC_URL=                 # Public bucket URL
  ```
- [ ] Add `.env.local` to `.gitignore`
- [ ] Set up Prisma v7 with Neon PostgreSQL — install `prisma` and `@prisma/client`, create `prisma/schema.prisma` with Phase 1 models (Organisation, User, Branch only for now), configure `lib/db.ts` with singleton PrismaClient
- [ ] Set up Upstash Redis cache client in `lib/cache.ts`:
  ```ts
  // getCachedOrFetch(key, fetcher, ttl?) — tries cache first, falls back to fetcher
  // invalidateTag(tag) — deletes all keys matching tag pattern
  ```
  Add `@upstash/redis` to dependencies.
- [ ] Apply design-style-guide.md tokens to `app/globals.css` using Tailwind v4 CSS-first `@theme` directive — NO `tailwind.config.ts`. Dark-only: set `:root` to dark values directly, no `.dark` class toggling needed.
- [ ] Create root layout (`app/layout.tsx`) with Plus Jakarta Sans font, QueryClientProvider (React Query), and dark background applied globally. No ThemeProvider — dark mode is fixed.
- [ ] Build **role-aware layout system**:
  - `app/(auth)/layout.tsx` — centered auth card layout, dark bg with purple glow
  - `app/(super-admin)/layout.tsx` — super admin sidebar + header
  - `app/(admin)/layout.tsx` — admin sidebar (collapsible) + page header
  - `app/(manager)/layout.tsx` — manager sidebar (subset of admin nav)
  - `app/(cashier)/layout.tsx` — minimal cashier layout (full-screen POS capable)
  - `app/(store)/layout.tsx` — store manager sidebar
- [ ] Build **Sidebar component** (`components/layout/sidebar.tsx`):
  - Dark `#0D0D1A` background
  - Collapsible (icon-only mode)
  - Active nav item: filled purple `#7C3AED` pill block
  - Organisation logo + name at top
  - User avatar + name + role badge at bottom
  - Nav items rendered from a role-based config array
- [ ] Build **PageHeader component** (`components/layout/page-header.tsx`): breadcrumb + page title (bold 800 weight) + optional actions slot + notification bell icon
- [ ] Install JB Better Auth UI: `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- [ ] **Integrate auth files into existing routes — do NOT overwrite existing `page.tsx` or `layout.tsx`. Edit and merge.**
- [ ] Configure Better Auth (`lib/auth.ts`) with email/password provider, session strategy, and organisationId + role stored in session user object
- [ ] Create `middleware.ts` — edge-level auth check:
  - Unauthenticated → redirect to `/login`
  - Role-based route protection (cashier cannot access `/dashboard`, admin cannot access `/cashier`, etc.)
  - Super admin routes protected separately
- [ ] Build custom `app/not-found.tsx`, `app/error.tsx`, `app/loading.tsx` — all styled dark with purple accent
- [ ] Build **NotificationBell component** with unread count badge (data fetched via React Query)
- [ ] Verify: login, signup, protected routes, role redirects all work end-to-end

### Dependencies
- Neon database created, `DATABASE_URL` set in `.env.local`
- Upstash Redis created, `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` set
- Resend account created, `RESEND_API_KEY` set

---

## Phase 2 — Core Data Models & Seed
**Goal:** Full Prisma schema defined, database migrated, realistic seed data in place.

### Tasks
- [ ] Define complete Prisma schema in `prisma/schema.prisma`:
  ```
  Models: Organisation, Branch, User, Category, Product,
  Supplier, StockEntry, Sale, SaleItem, DailyReport,
  Message, Notification, AuditLog
  ```
  Use `Decimal` for all monetary fields. All models include `createdAt` and `updatedAt`. All models scoped to `organisationId` where applicable.
- [ ] Run migration: `pnpm db:push && pnpm db:generate`
- [ ] Create `prisma/seed.ts` with realistic Ugandan business data:
  - 2 tenant organisations (e.g. "Kampala General Store", "Nakumatt Uganda")
  - 3–4 branches per org (Kampala, Entebbe, Jinja, Mbarara)
  - 5–8 users per org across all roles
  - 20+ products per org across 5+ categories (electronics, beverages, groceries, clothing, hardware)
  - 3–5 suppliers per org
  - 200+ sales entries over the past 30 days (mixed payment methods, cashiers, branches)
  - 500+ sale items across those sales
  - 50+ stock entries (IN, OUT, TRANSFER)
  - 10+ daily reports
  - 10+ messages
  - Low-stock scenarios (at least 5 products below threshold)
- [ ] Add scripts to `package.json`:
  ```json
  "db:push": "prisma db push",
  "db:generate": "prisma generate",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio"
  ```
- [ ] Run: `pnpm db:seed`
- [ ] Verify seed data in Prisma Studio: `pnpm db:studio`

### Dependencies
- Phase 1 complete

---

## Phase 3 — POS Sales & Cashier Interface
**Goal:** Cashier can record sales, view history, and submit daily reports.

### Tasks
- [ ] Install JB Data Table: `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- [ ] Build **POS Screen** (`app/(cashier)/cashier/page.tsx`):
  - Left panel: product grid (searchable, filterable by category, product cards with image + name + price in UGX)
  - Right panel: cart (items, quantities, subtotal, discount field, total in UGX)
  - Payment method selector: Cash / MTN MoMo / Airtel Money (pill toggle buttons)
  - "Complete Sale" button → creates Sale + SaleItems via API route → clears cart → shows success toast
  - Responsive: stacked on smaller screens
- [ ] Build **API Routes** with Redis caching:
  - `POST /api/sales` — create sale + sale items, invalidate sales cache, update stock (deduct)
  - `GET /api/sales?branchId=&date=` — list sales for cashier's branch + date, cached
  - `GET /api/products?organisationId=&categoryId=` — product list for POS, cached
- [ ] Build **Transaction History page** (`app/(cashier)/cashier/history/page.tsx`):
  - Today's sales table: time, items count, total UGX, payment method, status
  - Sale detail modal: itemised list, cashier, payment method, timestamp
  - Data Table with search + date filter
- [ ] Build **Daily Report Submit page** (`app/(cashier)/cashier/report/page.tsx`):
  - Form: auto-populated total sales + cash/mobile money breakdown from today's transactions
  - Notes textarea
  - Submit → creates DailyReport record → sends email to admin via Resend → shows confirmation
- [ ] Build **Cashier Messages page** (`app/(cashier)/cashier/messages/page.tsx`):
  - List of messages from manager, sorted by date
  - Mark as read on open
- [ ] Add loading skeletons for all cashier pages
- [ ] Add empty states for no sales, no messages
- [ ] Verify: full sale flow end-to-end, stock deduction, daily report email delivery

### Dependencies
- Phase 2 complete (seed data, Prisma schema)

---

## Phase 4 — Inventory & Stock Management
**Goal:** Store Manager can manage stock, suppliers, transfers, and export lists.

### Tasks
- [ ] Install JB File Storage UI: `pnpm dlx shadcn@latest add https://file-storage.desishub.com/r/file-storage.json`
- [ ] Configure Cloudflare R2 credentials in `.env.local` and create `lib/storage.ts` upload helper
- [ ] Build **Stock Overview page** (`app/(store)/store/inventory/page.tsx`):
  - Table: product, category, current stock, unit, branch, last updated, status badge (OK / LOW / OUT)
  - Low-stock rows highlighted with amber/red accent
  - Filters: category, status
  - Data Table with export
- [ ] Build **Stock Entry form** (`app/(store)/store/inventory/entry/page.tsx`):
  - Type selector: IN / OUT / TRANSFER
  - If IN: product selector, quantity, supplier selector, notes
  - If OUT: product, quantity, reason
  - If TRANSFER: product, quantity, destination branch selector
  - React Hook Form + Zod validation
  - Submit → POST `/api/stock/entries` → invalidate stock cache → create Notification for low-stock if applicable
- [ ] Build **Stock Transfers page** (`app/(store)/store/inventory/transfers/page.tsx`):
  - Outgoing transfers: status (PENDING / APPROVED / REJECTED)
  - Incoming transfers (for receiving branch): Approve / Reject actions
  - Approve → updates stock on both branches atomically
- [ ] Build **Supplier Management pages**:
  - List: `app/(store)/store/suppliers/page.tsx` — Data Table with search
  - Create/Edit: `app/(store)/store/suppliers/[id]/page.tsx` — React Hook Form + Zod
- [ ] Build **Stock Export page** (`app/(store)/store/export/page.tsx`):
  - Select branch, category filter, date
  - Export as Excel: uses `xlsx` library, generates stock list workbook
  - Export as PDF: uses `@react-pdf/renderer`, generates formatted stock list PDF
  - Both exports triggered from API routes: `GET /api/stock/export?format=xlsx|pdf`
- [ ] Build **API Routes**:
  - `GET /api/stock?branchId=` — stock levels, cached by branchId tag
  - `POST /api/stock/entries` — create stock entry, invalidate stock cache
  - `PATCH /api/stock/transfers/[id]` — approve/reject transfer
  - `GET /api/suppliers` — list suppliers, cached
  - `POST /api/suppliers` — create supplier
  - `GET /api/stock/export` — generate and stream Excel or PDF
- [ ] Build low-stock alert email template (`emails/low-stock-alert.tsx`) with React Email
- [ ] Wire low-stock notification: when stock entry causes stock < threshold, send email to admin + create in-app Notification
- [ ] Add loading skeletons and empty states for all store pages
- [ ] Verify: stock in/out flow, transfer approve/reject with correct stock updates, both export formats

### Dependencies
- Phase 2 complete
- Cloudflare R2 bucket created and credentials set

---

## Phase 5 — Admin Dashboard & Analytics
**Goal:** Admin and Manager have full analytics, branch management, user management, and reporting.

### Tasks
- [ ] Build **Admin Analytics Dashboard** (`app/(admin)/dashboard/page.tsx`):
  - Stat cards row: Total Revenue (UGX), Total Sales Count, Active Branches, Total Products — each with trend indicator
  - Revenue area chart (Recharts): daily/weekly/monthly toggle, shows revenue over time with purple gradient fill
  - Sales by Branch bar chart (Recharts): compare branches side by side, purple bars
  - Payment method donut chart (Recharts): Cash vs MTN MoMo vs Airtel Money breakdown
  - Top Products table: product name, units sold, revenue, branch
  - Date range filter (today / this week / this month / custom)
- [ ] Build **Branch Management pages**:
  - List: `app/(admin)/dashboard/branches/page.tsx` — cards or table with branch name, location, active staff count, today's sales
  - Create/Edit: form with React Hook Form + Zod
  - Detail: `app/(admin)/dashboard/branches/[id]/page.tsx` — branch-specific analytics, staff list, stock summary
- [ ] Build **User Management pages**:
  - List: `app/(admin)/dashboard/users/page.tsx` — Data Table: name, email, role badge, branch, status, actions
  - Invite user: modal form (name, email, role, branch) → creates user + sends welcome email via Resend
  - Deactivate/reactivate user
- [ ] Build **Product Management pages**:
  - List: `app/(admin)/dashboard/products/page.tsx` — Data Table with image thumbnail, name, SKU, category, price, stock status
  - Create: `app/(admin)/dashboard/products/new/page.tsx` — full form with R2 image upload
  - Edit: `app/(admin)/dashboard/products/[id]/edit/page.tsx`
- [ ] Build **Category Management** (`app/(admin)/dashboard/categories/page.tsx`):
  - Simple CRUD: list, add, rename, delete (with product count check)
- [ ] Build **Sales Overview** (`app/(admin)/dashboard/sales/page.tsx`):
  - Data Table: date, cashier, branch, items, payment method, total UGX, status
  - Filters: branch, cashier, payment method, date range
  - Sale detail modal with itemised receipt view
  - Void sale action (admin only) → creates AuditLog entry
- [ ] Build **Reports page** (`app/(admin)/dashboard/reports/page.tsx`):
  - Table of submitted daily reports: cashier, branch, date, total sales, cash, mobile money, notes
  - Filter by branch, cashier, date range
  - Mark as reviewed
- [ ] Build **Deep Analytics page** (`app/(admin)/dashboard/analytics/page.tsx`):
  - Branch comparison chart (multi-line or grouped bar)
  - Product performance chart (top 10 by revenue + units sold)
  - Sales heatmap by hour of day
  - Payment method trend over time
  - All charts use Recharts with purple/violet palette
- [ ] Build **Manager Dashboard** (`app/(manager)/...`):
  - Shares same analytics components but read-only
  - Manager can see all branches but cannot manage users or products
- [ ] Build **Internal Messaging** (`app/(admin)/dashboard/messages/page.tsx` and `/manager/messages/page.tsx`):
  - Inbox list: sender/recipient, subject, date, read status
  - Compose modal: select recipient (individual cashier or broadcast to branch), subject, body
  - Message detail panel
- [ ] Build **Notifications page** (`app/(admin)/dashboard/notifications/page.tsx`):
  - List all notifications (low stock, new report, transfer request, new message)
  - Mark all as read
  - Filter by type
- [ ] Build **Audit Log** (`app/(admin)/dashboard/audit-log/page.tsx`):
  - Data Table: timestamp, user, action, entity, details
  - Filter by user, action type, date range
- [ ] Build **Organisation Settings** (`app/(admin)/dashboard/settings/page.tsx`):
  - Update org name, logo upload (R2), low-stock threshold
  - React Hook Form + Zod
- [ ] Build **API Routes** with Redis caching for all above:
  - `GET /api/analytics/overview?orgId=&from=&to=` — dashboard stat cards, cached 5min
  - `GET /api/analytics/revenue?orgId=&period=` — revenue time series, cached 5min
  - `GET /api/analytics/branches?orgId=` — per-branch stats, cached 5min
  - `GET /api/branches` — list branches, cached
  - `POST/PATCH/DELETE /api/branches/[id]` — invalidate branch cache
  - `GET /api/users?orgId=` — list users, cached
  - `POST /api/users/invite` — invite user, send welcome email
  - `GET /api/products?orgId=` — product list, cached
  - `POST/PATCH /api/products/[id]` — upsert product, invalidate cache
  - `GET /api/reports?orgId=` — daily reports, cached
  - `GET /api/messages?userId=` — messages, cached
  - `POST /api/messages` — send message, create Notification
  - `GET /api/notifications?userId=` — notifications, cached
  - `POST /api/audit` — internal helper to create audit log entry
- [ ] Add Suspense boundaries on every data-fetching section
- [ ] Add ErrorBoundary on all major dashboard blocks
- [ ] Add skeletons for all charts and tables

### Dependencies
- Phase 3 complete (sales data flowing)
- Phase 4 complete (stock data flowing)

---

## Phase 6 — Super Admin Platform Dashboard
**Goal:** You (the SaaS owner) can manage all tenant organisations.

### Tasks
- [ ] Build **Super Admin Dashboard** (`app/(super-admin)/super-admin/page.tsx`):
  - Platform stat cards: total organisations, total users, total sales today (platform-wide)
  - Recent organisations list
- [ ] Build **Organisations list** (`app/(super-admin)/super-admin/organisations/page.tsx`):
  - Data Table: org name, logo, plan, branches count, users count, created date
  - Create new organisation button → opens form (org name, admin email, admin name) → creates Organisation + Admin user + sends welcome email
- [ ] Build **Organisation detail** (`app/(super-admin)/super-admin/organisations/[id]/page.tsx`):
  - Org info, branches list, users list, recent activity
  - "Impersonate Admin" button → sets impersonation session → redirects to admin dashboard
- [ ] Build `middleware.ts` guard for `/super-admin` routes — only SUPER_ADMIN role allowed
- [ ] Build **API Routes**:
  - `GET /api/super-admin/organisations` — all orgs
  - `POST /api/super-admin/organisations` — create org + admin user
  - `POST /api/super-admin/impersonate` — set impersonation

### Dependencies
- Phase 5 complete

---

## Phase 7 — Email Templates & Notifications
**Goal:** All transactional emails built and wired.

### Tasks
- [ ] Install React Email: `pnpm add @react-email/components react-email`
- [ ] Build email templates in `emails/`:
  - `welcome.tsx` — Welcome email for new invited users (includes temp password or magic link)
  - `daily-report.tsx` — Sent to admin when cashier submits daily report (summary table)
  - `low-stock-alert.tsx` — Sent to admin + store manager listing products below threshold
  - `stock-transfer-request.tsx` — Sent to receiving branch store manager
- [ ] Wire welcome email on `POST /api/users/invite`
- [ ] Wire daily report email on `POST /api/reports`
- [ ] Wire low-stock alert on stock entry that drops below threshold
- [ ] Wire stock transfer email on transfer creation
- [ ] Test all emails via Resend test mode (`resend.emails.send` with test flag)

### Dependencies
- Phase 5 complete (user invite flow exists)

---

## Phase 8 — Polish, Landing Page & Deploy
**Goal:** App is production-ready, landing page live, deployed to Vercel.

### Tasks
- [ ] Build **Landing Page** (`app/(marketing)/page.tsx`):
  - Hero: dark gradient bg, bold headline ("Run Every Branch. Own Every Sale."), sub-headline, CTA button ("Request a Demo" → mailto or contact form)
  - Features section: 3-column grid with icon cards (POS, Inventory, Analytics)
  - "Who is it for" section: role cards (Admin, Manager, Cashier, Store Manager)
  - Pricing section: simple 2 tiers (Contact Us for pricing — no self-serve in v1)
  - Footer: logo, links, "Made in Uganda 🇺🇬"
  - Framer Motion: staggered fade-in on scroll
- [ ] Test all CRUD operations end-to-end
- [ ] Test all role-based access controls
- [ ] Test POS sale flow: create sale → stock deducted → cashier history updated → daily report reflects it
- [ ] Test stock transfer: initiate → approval → both branch stocks updated
- [ ] Test all email triggers
- [ ] Test export: Excel + PDF stock list generation
- [ ] Verify responsive layout on mobile (admin dashboard + cashier POS)
- [ ] **Run pre-deploy code review** using `pre-deploy-review.md` prompt in Claude Code. Address all Critical issues. Save report to `pre-deploy-review-report.md`.
- [ ] Set all environment variables in Vercel dashboard
- [ ] Deploy to Vercel (`vercel --prod`)
- [ ] Configure Cloudflare DNS + custom domain (e.g. `TPAPOS.co.ug`)
- [ ] Verify Resend sending domain is verified
- [ ] Run production checklist (below)

### Production Checklist
- [ ] All env vars set in Vercel (DATABASE_URL, UPSTASH_*, BETTER_AUTH_*, RESEND_*, R2_*)
- [ ] Neon database migrations applied to production branch
- [ ] Auth flows (login, password reset) work on production URL
- [ ] Custom domain live with SSL certificate
- [ ] Emails landing in inbox (not spam) — check SPF/DKIM on Resend
- [ ] R2 file uploads working in production (product images, logos)
- [ ] Stock export (Excel + PDF) working in production
- [ ] Super admin can create a new organisation end-to-end
- [ ] 404 and error pages styled correctly
- [ ] Redis cache responding (check Upstash dashboard for requests)
- [ ] No console errors in production build (`next build` clean)

### Dependencies
- All phases complete
