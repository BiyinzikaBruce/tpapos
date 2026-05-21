# Claude Code — TPAPOS Build Prompt

Read the following files in order before doing anything:
1. `master_prompt.md` — Your tech stack rules, Prisma v7 patterns, and coding standards. Follow EXACTLY.
2. `design-style-guide.md` — The visual design system for TPAPOS. Apply to every component you build.
3. `jb-components.md` — The JB component reference. Use these components before writing from scratch.
4. `project-description.md` — What we are building. Every decision must align with this.
5. `project-phases.md` — The build plan. Work through phases in order.

---

## Project Context

**TPAPOS** is a multi-tenant SaaS POS and business management platform for Ugandan businesses. It supports multiple client organisations (tenants), each with multiple branches. There are 5 user roles: Super Admin (platform owner), Admin/Owner, Manager, Store Manager, and Cashier. All monetary values are in **UGX (Ugandan Shillings)** with no decimal places.

---

## Non-Negotiable Rules

### Architecture
- Work through **ONE phase at a time**. Complete all tasks in a phase before moving to the next.
- After completing each phase, **stop and confirm with me** before proceeding.
- Every API route must scope data by `organisationId` — never return cross-tenant data.
- All route handlers must validate that the authenticated user belongs to the organisation they are querying.

### Data & Caching
- **Use React Query for all client data fetching** — never `useEffect` for data loading.
- **Use Redis caching at the API layer** via `getCachedOrFetch` and `invalidateTag` from `lib/cache.ts`.
- Every `GET` API route must cache its response. Every mutation (`POST`, `PATCH`, `DELETE`) must invalidate the relevant cache tag.
- Use Prisma v7 patterns exactly as specified in `master_prompt.md`. Do NOT use Prisma v6 syntax.
- All monetary fields use `Decimal` type in Prisma schema. Format with `formatUGX()` from `lib/format.ts`.

### Forms & Validation
- All forms use **React Hook Form + Zod** — never uncontrolled inputs or useState for form state.
- Every form must be wrapped in a `<Suspense>` boundary and an `<ErrorBoundary>`.
- Zod schemas live in `lib/validations/[entity].ts`.

### Components
- **Before building auth, data tables, file uploads from scratch — check `jb-components.md` and install first.**
- Use `@react-pdf/renderer` for PDF generation. **Never jsPDF.**
- Use `xlsx` for Excel export.
- Use Framer Motion for animations. Animate `transform` and `opacity` only.
- Use `lucide-react` for all icons.

### Design
- Follow `design-style-guide.md` tokens exactly — colors, typography, spacing, radius.
- **Dark-only:** The app has NO light mode. Do not add ThemeProvider or next-themes. Apply dark values directly to `:root` in `globals.css`.
- All monetary displays must use `formatUGX()` — "UGX 1,250,000" format.
- Chart colors must use the purple palette defined in the style guide.

### Performance
- Use `next/dynamic` with `ssr: false` for Recharts, heavy modals, and the POS product grid.
- Add `<Suspense>` boundaries on every data-fetching section with skeleton fallbacks.
- Add `<ErrorBoundary>` on all major page blocks.
- Use `aspect-ratio` on all product images — never fixed height on image containers.

### Multi-Tenancy
- Every Prisma query that reads organisation-scoped data MUST include `where: { organisationId }`.
- The `organisationId` must come from the authenticated session — never from URL params or request body alone (always verify session org matches requested org).
- Super Admin routes (`/super-admin/*`) are the only exception — they can query across tenants.

### Security
- Middleware must verify auth on ALL routes except `/`, `/login`, `/forgot-password`, `/reset-password`.
- Role-based access must be enforced at BOTH middleware level AND API route level.
- Never expose another tenant's data, even in error messages.

---

## Key Utility Functions to Create in Phase 1

```ts
// lib/format.ts
export function formatUGX(amount: number | Decimal): string {
  return `UGX ${Number(amount).toLocaleString('en-UG', { maximumFractionDigits: 0 })}`;
}

// lib/cache.ts  
// getCachedOrFetch(key: string, fetcher: () => Promise<T>, ttl?: number): Promise<T>
// invalidateTag(tag: string): Promise<void>

// lib/auth-helpers.ts
// getSessionOrRedirect() — gets session from Better Auth, throws if not authenticated
// requireRole(session, ...roles) — throws 403 if user role not in allowed list
// requireSameOrg(session, organisationId) — throws 403 if org mismatch
```

---

## Role-Based Route Structure

```
/                           → Public landing page
/login                      → Auth (all roles)
/(super-admin)/super-admin  → SUPER_ADMIN only
/(admin)/dashboard          → ADMIN only
/(manager)/manager          → MANAGER only
/(cashier)/cashier          → CASHIER only
/(store)/store              → STORE_MANAGER only
```

Middleware redirect logic:
- Unauthenticated → `/login`
- SUPER_ADMIN → `/super-admin`
- ADMIN → `/dashboard`
- MANAGER → `/manager/dashboard`
- CASHIER → `/cashier`
- STORE_MANAGER → `/store/inventory`

---

## Start

Begin with **Phase 1 — Foundation** from `project-phases.md`.

Read the full Phase 1 task list and execute tasks in order. After completing every task in Phase 1, run the app, verify login + protected routes work for all 5 roles, then stop and report back with:
1. What was completed
2. Any decisions you made that deviate from the spec (explain why)
3. Any blockers or things I need to configure manually (env vars, external services)

Then wait for my confirmation before starting Phase 2.
