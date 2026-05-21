# TPAPOS — Master Prompt (Tech Stack, Prisma v7 Patterns, Coding Standards)

This file defines the **non-negotiable technical rules** for the TPAPOS build. Every decision must conform to these standards. When in doubt, follow this file exactly.

---

## Tech Stack — Exact Versions

| Layer | Library | Version | Notes |
|---|---|---|---|
| Framework | Next.js | 16 (App Router) | No Pages Router. No `src/` dir. |
| Language | TypeScript | 5.x | Strict mode ON |
| Styling | Tailwind CSS | v4 | CSS-first `@theme` — no `tailwind.config.ts` |
| UI Components | shadcn/ui | latest | Dark mode only — no ThemeProvider |
| ORM | Prisma | v7 | See Prisma section below |
| Database | Neon (PostgreSQL) | latest | Connection pooling via `?pgbouncer=true` |
| Auth | Better Auth | v1 | Email/password only |
| Server state | TanStack Query | v5 | No `useEffect` for data fetching |
| Forms | React Hook Form | v7 | Always paired with Zod |
| Validation | Zod | v3 | Schemas in `lib/validations/` |
| Cache | Upstash Redis | @upstash/redis | REST client, not ioredis |
| File storage | Cloudflare R2 | @aws-sdk/client-s3 | S3-compatible API |
| Email | Resend | latest | React Email templates |
| Charts | Recharts | v2 | Dynamically imported, `ssr: false` |
| Animation | Framer Motion | v11 | transform + opacity only |
| Icons | lucide-react | latest | No other icon libraries |
| PDF export | @react-pdf/renderer | latest | Never jsPDF |
| Excel export | xlsx | latest | |
| Email templates | @react-email/components + react-email | latest | |

---

## Project Structure

```
a:\tpa-pos\
├── app/
│   ├── (auth)/                  # login, forgot-password, reset-password
│   ├── (super-admin)/           # super admin routes
│   ├── (admin)/                 # admin dashboard routes
│   ├── (manager)/               # manager routes
│   ├── (cashier)/               # cashier POS routes
│   ├── (store)/                 # store manager routes
│   ├── api/                     # Route Handlers
│   ├── globals.css              # Tailwind v4 @theme tokens — the ONLY CSS file
│   ├── layout.tsx               # Root layout — font, QueryClientProvider
│   ├── not-found.tsx
│   ├── error.tsx
│   └── loading.tsx
├── components/
│   ├── layout/                  # sidebar, page-header, notification-bell
│   ├── ui/                      # shadcn components (auto-generated)
│   └── [feature]/               # feature-specific components
├── lib/
│   ├── db.ts                    # Prisma singleton
│   ├── auth.ts                  # Better Auth config
│   ├── auth-helpers.ts          # getSessionOrRedirect, requireRole, requireSameOrg
│   ├── cache.ts                 # getCachedOrFetch, invalidateTag
│   ├── storage.ts               # R2 upload/delete helpers
│   ├── format.ts                # formatUGX
│   └── validations/             # Zod schemas per entity
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── emails/                      # React Email templates
├── middleware.ts
└── .env.local
```

**Rules:**
- Flat root layout — `app/`, `components/`, `lib/` at project root. **No `src/` wrapper.**
- `tsconfig.json` paths must be `"@/*": ["./*"]` — never `"./src/*"`.
- One `globals.css` — all Tailwind tokens defined there with `@theme {}`. No other CSS files.

---

## TypeScript Rules

```ts
// tsconfig.json must include:
{
  "compilerOptions": {
    "strict": true,
    "paths": { "@/*": ["./*"] }
  }
}
```

- **Always** type function return values for server functions and API handlers.
- **Never** use `any`. Use `unknown` and narrow with type guards.
- **Never** use `as SomeType` casts unless unavoidable (document why with a comment).
- All Prisma query results are typed automatically — use the generated types.
- Use `z.infer<typeof schema>` to derive form types from Zod schemas.

---

## Next.js 16 App Router Rules

### Server vs Client Components

```tsx
// Server Component — default, no directive needed
// Can: access DB, read env vars, use async/await directly
export default async function ProductsPage() {
  const products = await db.product.findMany();
  return <ProductList products={products} />;
}

// Client Component — must opt in
"use client";
// Can: use hooks, browser APIs, event handlers, React Query
```

**Rule:** Default to Server Components. Only add `"use client"` when you need hooks, event handlers, or browser APIs.

### Route Handlers (API Routes)

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  // Always: validate session, scope to org, cache response
}

export async function POST(req: NextRequest) {
  // Always: validate session, validate body with Zod, invalidate cache
}
```

### Dynamic Imports (Required for heavy components)

```ts
import dynamic from "next/dynamic";

// Recharts — always ssr:false
const RevenueChart = dynamic(() => import("@/components/charts/revenue-chart"), { ssr: false });

// Heavy modals
const ProductModal = dynamic(() => import("@/components/products/product-modal"), { ssr: false });

// POS product grid
const ProductGrid = dynamic(() => import("@/components/pos/product-grid"), { ssr: false });
```

### Metadata

```ts
// app/(admin)/dashboard/page.tsx
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Dashboard — TPAPOS" };
```

### Loading / Error / Not Found

Every route group must have `loading.tsx` with skeleton fallback. `error.tsx` must be a Client Component:

```tsx
// app/(admin)/dashboard/error.tsx
"use client";
export default function DashboardError({ error, reset }: { error: Error; reset: () => void }) {
  return (/* dark error card with retry button */);
}
```

---

## Prisma v7 — Exact Patterns

### Installation & Setup

```bash
pnpm add prisma @prisma/client
pnpm add -D prisma
```

`package.json` scripts:
```json
{
  "db:push": "prisma db push",
  "db:generate": "prisma generate",
  "db:seed": "tsx prisma/seed.ts",
  "db:studio": "prisma studio"
}
```

### schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DATABASE_URL")
}
```

> Neon requires `directUrl` for migrations. Connection string must include `?pgbouncer=true&connect_timeout=15` for pooled connections.

### Singleton Client (`lib/db.ts`)

```ts
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
});

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

**Always import from `@/lib/db`**, never instantiate `new PrismaClient()` anywhere else.

### Prisma v7 Query Patterns

**findUnique — use `findUniqueOrThrow` when the record must exist:**
```ts
// v7: use findUniqueOrThrow — throws PrismaClientKnownRequestError if not found
const product = await db.product.findUniqueOrThrow({
  where: { id },
});

// Only use findUnique when null is a valid result
const product = await db.product.findUnique({
  where: { id },
});
```

**findFirst with org scoping:**
```ts
const product = await db.product.findFirstOrThrow({
  where: {
    id,
    organisationId, // ALWAYS scope to org
  },
  include: { category: true },
});
```

**findMany — always include organisationId scope:**
```ts
const products = await db.product.findMany({
  where: {
    organisationId,          // REQUIRED on all org-scoped queries
    isActive: true,
    ...(categoryId ? { categoryId } : {}),
  },
  include: {
    category: { select: { id: true, name: true } }, // select only needed fields
  },
  orderBy: { createdAt: "desc" },
  take: limit,
  skip: offset,
});
```

**create:**
```ts
const product = await db.product.create({
  data: {
    name,
    sku,
    price,          // Decimal fields: pass number, Prisma handles coercion
    categoryId,
    organisationId, // ALWAYS set on create
    createdById: session.user.id,
  },
});
```

**update:**
```ts
const product = await db.product.update({
  where: { id },
  data: { name, price },
});
```

**Decimal fields — always use `Number()` when passing to `formatUGX`:**
```ts
import { Prisma } from "@prisma/client";

// In schema: price Decimal
// When creating: pass a number, Prisma coerces to Decimal
await db.product.create({ data: { price: 5000 } });

// When reading: Decimal is an object, convert before formatting
formatUGX(Number(product.price)); // ✅
formatUGX(product.price);         // ❌ TypeScript error
```

**Transactions — for multi-step operations (stock transfers, sale creation):**
```ts
const [sale, updatedStock] = await db.$transaction([
  db.sale.create({ data: saleData }),
  db.stockEntry.create({ data: stockData }),
]);

// For interactive transactions (when you need the result of step 1 in step 2):
const result = await db.$transaction(async (tx) => {
  const sale = await tx.sale.create({ data: saleData });
  await tx.saleItem.createMany({
    data: items.map(item => ({ ...item, saleId: sale.id })),
  });
  return sale;
});
```

**createMany — for bulk inserts (sale items, seed data):**
```ts
await db.saleItem.createMany({
  data: items.map(item => ({
    saleId,
    productId: item.productId,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
  })),
});
```

**count — for pagination:**
```ts
const [products, total] = await db.$transaction([
  db.product.findMany({ where, skip, take }),
  db.product.count({ where }),
]);
```

**Aggregation (for analytics):**
```ts
const revenue = await db.sale.aggregate({
  where: { organisationId, status: "COMPLETED", createdAt: { gte: from, lte: to } },
  _sum: { total: true },
  _count: { id: true },
});

const totalRevenue = Number(revenue._sum.total ?? 0);
const totalCount = revenue._count.id;
```

**groupBy (for branch/product analytics):**
```ts
const salesByBranch = await db.sale.groupBy({
  by: ["branchId"],
  where: { organisationId, status: "COMPLETED" },
  _sum: { total: true },
  _count: { id: true },
});
```

**select vs include — prefer select for API responses:**
```ts
// select: explicit fields (better for API performance)
const users = await db.user.findMany({
  where: { organisationId },
  select: {
    id: true,
    name: true,
    email: true,
    role: true,
    branch: { select: { id: true, name: true } },
  },
});

// include: entire related model (use when you need all fields)
const sale = await db.sale.findUniqueOrThrow({
  where: { id },
  include: { saleItems: { include: { product: true } } },
});
```

---

## Redis Cache (`lib/cache.ts`)

```ts
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl = 300  // 5 minutes default
): Promise<T> {
  const cached = await redis.get<T>(key);
  if (cached !== null) return cached;
  const data = await fetcher();
  await redis.setex(key, ttl, data);
  return data;
}

export async function invalidateTag(tag: string): Promise<void> {
  const keys = await redis.keys(`${tag}:*`);
  if (keys.length > 0) await redis.del(...keys);
}
```

### Cache Key Conventions

```ts
// Format: entity:orgId:qualifier
`products:${organisationId}`
`products:${organisationId}:category:${categoryId}`
`sales:${organisationId}:branch:${branchId}:date:${date}`
`analytics:${organisationId}:overview:${period}`
`stock:${organisationId}:branch:${branchId}`
`users:${organisationId}`
`notifications:${userId}`
```

### Cache TTL Guidelines

| Data type | TTL |
|---|---|
| Analytics / dashboard stats | 300s (5 min) |
| Product list | 600s (10 min) |
| Stock levels | 120s (2 min) |
| User list | 600s (10 min) |
| Notifications | 60s (1 min) |
| Sales list | 120s (2 min) |

### Invalidation Rules

Every `POST`, `PATCH`, `DELETE` route handler must call `invalidateTag` for the relevant entities:

```ts
// After creating a sale:
await invalidateTag(`sales:${organisationId}`);
await invalidateTag(`analytics:${organisationId}`);
await invalidateTag(`stock:${organisationId}`);  // stock was deducted

// After updating a product:
await invalidateTag(`products:${organisationId}`);

// After approving a stock transfer:
await invalidateTag(`stock:${organisationId}`);
```

---

## Auth Helpers (`lib/auth-helpers.ts`)

```ts
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getSessionOrRedirect() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return NextResponse.redirect(new URL("/login", process.env.BETTER_AUTH_URL));
  }
  return session;
}

// Use in Route Handlers — throws 403 response if role not allowed
export function requireRole(
  session: { user: { role: string } },
  ...roles: string[]
) {
  if (!roles.includes(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null; // no error
}

// Verifies the session user belongs to the requested org
export function requireSameOrg(
  session: { user: { organisationId: string } },
  organisationId: string
) {
  if (session.user.organisationId !== organisationId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}
```

### Route Handler Pattern (complete example)

```ts
// app/api/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCachedOrFetch, invalidateTag } from "@/lib/cache";
import { getSessionOrRedirect, requireRole, requireSameOrg } from "@/lib/auth-helpers";
import { productSchema } from "@/lib/validations/product";

export async function GET(req: NextRequest) {
  const session = await getSessionOrRedirect();
  if (session instanceof NextResponse) return session;

  const { searchParams } = req.nextUrl;
  const organisationId = session.user.organisationId;

  const products = await getCachedOrFetch(
    `products:${organisationId}`,
    () => db.product.findMany({
      where: { organisationId, isActive: true },
      include: { category: { select: { id: true, name: true } } },
      orderBy: { name: "asc" },
    }),
    600
  );

  return NextResponse.json(products);
}

export async function POST(req: NextRequest) {
  const session = await getSessionOrRedirect();
  if (session instanceof NextResponse) return session;

  const forbidden = requireRole(session, "ADMIN");
  if (forbidden) return forbidden;

  const body = await req.json();
  const parsed = productSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const product = await db.product.create({
    data: { ...parsed.data, organisationId: session.user.organisationId },
  });

  await invalidateTag(`products:${session.user.organisationId}`);

  return NextResponse.json(product, { status: 201 });
}
```

---

## React Query (`"use client"` components only)

### Setup (root layout)

```tsx
// app/layout.tsx
"use client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: { queries: { staleTime: 60 * 1000 } },
  }));

  return (
    <html lang="en">
      <body>
        <QueryClientProvider client={queryClient}>
          {children}
        </QueryClientProvider>
      </body>
    </html>
  );
}
```

### Query Pattern

```ts
import { useQuery } from "@tanstack/react-query";

const { data: products = [], isLoading, error } = useQuery({
  queryKey: ["products"],
  queryFn: () => fetch("/api/products").then(r => r.json()),
});
```

### Mutation Pattern

```ts
import { useMutation, useQueryClient } from "@tanstack/react-query";

const queryClient = useQueryClient();

const { mutate, isPending } = useMutation({
  mutationFn: (data: ProductFormValues) =>
    fetch("/api/products", { method: "POST", body: JSON.stringify(data) }).then(r => r.json()),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["products"] });
    toast.success("Product created");
  },
  onError: () => toast.error("Failed to create product"),
});
```

**Rules:**
- `queryKey` arrays must match what you invalidate in `onSuccess`.
- Always provide a fallback default value: `data: products = []`.
- Never use `useEffect` to fetch data — always React Query.

---

## Tailwind v4 (CSS-first)

Tailwind v4 uses a **CSS-first configuration** — no `tailwind.config.ts`. All design tokens are defined directly in `app/globals.css` with the `@theme` directive.

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  /* All color, font, spacing, radius tokens from design-style-guide.md go here */
  --color-bg-base: #0B0B18;
  --color-primary: #7C3AED;
  /* ... etc */
}

:root {
  background-color: var(--color-bg-base);
  color: var(--color-text-primary);
}
```

**Rules:**
- **No `tailwind.config.ts`** — Tailwind v4 does not use it.
- **No `@apply`** for design tokens — use CSS variables directly or Tailwind utility classes.
- Dark mode is fixed — set all values on `:root` directly. No `.dark` class. No `next-themes`.
- Custom tokens defined in `@theme` are automatically available as Tailwind utility classes.

---

## Forms — React Hook Form + Zod

### Zod Schema Convention

```ts
// lib/validations/product.ts
import { z } from "zod";

export const productSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  sku: z.string().min(1, "SKU is required").max(50),
  categoryId: z.string().cuid("Invalid category"),
  price: z.coerce.number().min(0, "Price must be positive"),
  unit: z.string().min(1, "Unit is required"),
  imageUrl: z.string().url().optional().nullable(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
```

**Rules:**
- Use `z.coerce.number()` for price/quantity fields — coerces string input from HTML forms to number.
- Use `z.string().cuid()` for ID fields that reference other records.
- All schemas exported from `lib/validations/[entity].ts`.
- The same schema is used on both client (form validation) and server (API body validation).

---

## File Naming Conventions

```
# Pages
app/(admin)/dashboard/products/page.tsx
app/(admin)/dashboard/products/new/page.tsx
app/(admin)/dashboard/products/[id]/edit/page.tsx

# Components — kebab-case filenames, PascalCase exports
components/products/product-card.tsx          → export function ProductCard
components/layout/sidebar.tsx                 → export function Sidebar
components/charts/revenue-chart.tsx           → export function RevenueChart

# API routes
app/api/products/route.ts                     → GET, POST
app/api/products/[id]/route.ts                → GET, PATCH, DELETE

# Lib
lib/validations/product.ts                    → productSchema, ProductFormValues
lib/format.ts                                 → formatUGX
lib/db.ts                                     → db (PrismaClient singleton)
lib/cache.ts                                  → getCachedOrFetch, invalidateTag
lib/storage.ts                                → uploadToR2, deleteFromR2
lib/auth.ts                                   → auth
lib/auth-helpers.ts                           → getSessionOrRedirect, requireRole, requireSameOrg
```

---

## Cloudflare R2 Storage (`lib/storage.ts`)

```ts
import { S3Client, PutObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function getUploadUrl(key: string, contentType: string) {
  return getSignedUrl(r2, new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
    ContentType: contentType,
  }), { expiresIn: 300 });
}

export function getPublicUrl(key: string) {
  return `${process.env.R2_PUBLIC_URL}/${key}`;
}

export async function deleteFromR2(key: string) {
  await r2.send(new DeleteObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  }));
}
```

---

## Email (Resend + React Email)

```ts
// lib/email.ts
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  template,
}: {
  to: string;
  subject: string;
  template: React.ReactElement;
}) {
  await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    react: template,
  });
}
```

### Email Template Pattern

```tsx
// emails/welcome.tsx
import { Html, Head, Body, Container, Text, Button } from "@react-email/components";

interface WelcomeEmailProps {
  userName: string;
  organisationName: string;
  loginUrl: string;
  tempPassword: string;
}

export default function WelcomeEmail({ userName, organisationName, loginUrl, tempPassword }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={{ backgroundColor: "#0B0B18", fontFamily: "sans-serif" }}>
        <Container>
          <Text>Welcome to {organisationName}, {userName}</Text>
          <Text>Your temporary password: {tempPassword}</Text>
          <Button href={loginUrl}>Log In to TPAPOS</Button>
        </Container>
      </Body>
    </Html>
  );
}
```

---

## Middleware (`middleware.ts`)

```ts
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";

const PUBLIC_ROUTES = ["/", "/login", "/forgot-password", "/reset-password"];

const ROLE_REDIRECTS: Record<string, string> = {
  SUPER_ADMIN: "/super-admin",
  ADMIN: "/dashboard",
  MANAGER: "/manager/dashboard",
  CASHIER: "/cashier",
  STORE_MANAGER: "/store/inventory",
};

const ROLE_ALLOWED_PREFIXES: Record<string, string[]> = {
  SUPER_ADMIN: ["/super-admin"],
  ADMIN: ["/dashboard"],
  MANAGER: ["/manager"],
  CASHIER: ["/cashier"],
  STORE_MANAGER: ["/store"],
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (PUBLIC_ROUTES.some(r => pathname === r || pathname.startsWith(r + "/"))) {
    return NextResponse.next();
  }

  const session = await auth.api.getSession({ headers: req.headers });

  if (!session) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  const role = session.user.role as string;
  const allowedPrefixes = ROLE_ALLOWED_PREFIXES[role] ?? [];
  const isAllowed = allowedPrefixes.some(prefix => pathname.startsWith(prefix));

  if (!isAllowed) {
    const redirect = ROLE_REDIRECTS[role] ?? "/login";
    return NextResponse.redirect(new URL(redirect, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
```

---

## UGX Currency Formatting (`lib/format.ts`)

```ts
import { Decimal } from "@prisma/client/runtime/library";

export function formatUGX(amount: number | Decimal): string {
  return `UGX ${Number(amount).toLocaleString("en-UG", { maximumFractionDigits: 0 })}`;
}

// Abbreviated for chart Y-axis labels
export function formatUGXShort(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(0)}K`;
  return String(amount);
}
```

---

## Error Handling Rules

- API routes return `NextResponse.json({ error: "message" }, { status: N })` — never throw.
- 400: validation failure (include Zod error details)
- 401: not authenticated
- 403: authenticated but wrong role or wrong org
- 404: record not found
- 500: unexpected server error (log it, return generic message)
- Client components catch mutation errors in `onError` and show a `toast.error()`.
- Never expose Prisma error details or stack traces to the client.

```ts
// Catch Prisma not-found errors in route handlers:
import { Prisma } from "@prisma/client";

try {
  const product = await db.product.findUniqueOrThrow({ where: { id } });
  return NextResponse.json(product);
} catch (e) {
  if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2025") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  console.error(e);
  return NextResponse.json({ error: "Internal server error" }, { status: 500 });
}
```

---

## Performance Rules

- `next/dynamic` with `ssr: false` for: Recharts, POS product grid, heavy modals.
- `<Suspense>` boundary on every data-fetching section with a skeleton fallback.
- `<ErrorBoundary>` on all major page blocks.
- `aspect-ratio` on all product image containers — never fixed `height` on image wrappers.
- `select` only the fields you need in Prisma queries — never `include` entire models when a `select` works.
- Analytics queries cached for 5 minutes. Invalidate on any sale creation.

---

## What NOT to Do

| ❌ Don't | ✅ Do instead |
|---|---|
| `useEffect` for data fetching | `useQuery` from React Query |
| `useState` for form state | `useForm` from React Hook Form |
| `new PrismaClient()` in a route | `import { db } from "@/lib/db"` |
| `tailwind.config.ts` | `@theme {}` in `globals.css` |
| `jsPDF` for PDFs | `@react-pdf/renderer` |
| `ThemeProvider` / `next-themes` | Dark values directly on `:root` |
| `src/` directory | Flat root layout |
| URL params as only auth | Session org + URL param must match |
| Expose Prisma errors to client | Generic error message + `console.error` |
| `any` TypeScript type | `unknown` + type guard |
| `import { PrismaClient } from "@prisma/client"` in components | `import { db } from "@/lib/db"` |
