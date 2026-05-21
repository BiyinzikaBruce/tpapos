# TPAPOS — JB Component Reference

These four components must be installed **before** building any feature that uses them. Check this file before writing auth, tables, uploads, or forms from scratch.

---

## Install Commands (run once per phase)

```bash
# Phase 1 — Auth + Form
pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json
pnpm dlx shadcn@latest add https://vibekit.desishub.com/r/form.json

# Phase 3 — Data Table
pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json

# Phase 4 — File Storage
pnpm dlx shadcn@latest add https://file-storage.desishub.com/r/file-storage.json
```

> **Note:** If `vibekit.desishub.com/r/form.json` returns 404, fall back to `pnpm dlx shadcn@latest add form` — the standard shadcn Form component. All forms in TPAPOS use React Hook Form + Zod regardless.

---

## 1. Better Auth UI

**Registry:** `https://better-auth-ui.desishub.com/r/auth-components.json`  
**Install in:** Phase 1  
**Used on:** `/login`, `/forgot-password`, `/reset-password`

### Available Components

| Component | Route | Notes |
|---|---|---|
| `<SignIn />` | `/login` | Email + password only — no OAuth in TPAPOS |
| `<SignUp />` | N/A | Not exposed to end users — admin invites users |
| `<VerifyEmail />` | Internal | 6-digit OTP; used if email verification is enabled |
| `<ForgetPassword />` | `/forgot-password` | Sends reset email via Resend |
| `<ResetPassword />` | `/reset-password` | Token-based password reset |
| `<ChangePassword />` | `/dashboard/settings` | For logged-in users only |
| `<Profile />` | Optional | User profile management |
| `<LogoutButton />` | Sidebar footer | Configurable variant + size |

### Usage

```tsx
// app/(auth)/login/page.tsx
import { SignIn } from "@/components/auth";

export default function LoginPage() {
  return <SignIn />;
}

// app/(auth)/forgot-password/page.tsx
import { ForgetPassword } from "@/components/auth";

export default function ForgotPasswordPage() {
  return <ForgetPassword />;
}

// app/(auth)/reset-password/page.tsx
import { ResetPassword } from "@/components/auth";

export default function ResetPasswordPage() {
  return <ResetPassword />;
}
```

### LogoutButton Props

```tsx
<LogoutButton
  variant="ghost"       // "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size="default"        // "default" | "sm" | "lg" | "icon"
  showIcon={true}       // shows LogOut icon from lucide-react
  className="w-full"
/>
```

### TPAPOS Configuration Rules

- **Disable OAuth** in Better Auth config — TPAPOS uses email/password only.
- After login, redirect based on role (handled by `middleware.ts`).
- `<SignUp />` should NOT be placed on any public route — admin creates users via invite flow.
- The `<Profile />` component accepts an optional `user` prop: `{ name?, email?, image? }`.

### Better Auth Setup (`lib/auth.ts`)

```ts
import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "@/lib/db";

export const auth = betterAuth({
  database: prismaAdapter(db, { provider: "postgresql" }),
  emailAndPassword: { enabled: true },
  session: {
    additionalFields: {
      role: { type: "string" },
      organisationId: { type: "string" },
      branchId: { type: "string" },
    },
  },
});
```

---

## 2. JB Data Table

**Registry:** `https://jb.desishub.com/r/data-table.json`  
**Install in:** Phase 3  
**Used on:** All admin/manager tables — products, users, sales, reports, audit log, stock

### Available Components & Helpers

| Export | Type | Purpose |
|---|---|---|
| `DataTable` | Component | Main table with search, sort, pagination, visibility |
| `DataTableSearch` | Component | Standalone search input |
| `DataTableViewOptions` | Component | Column visibility dropdown |
| `DataTablePagination` | Component | Page controls + rows-per-page selector |
| `SortableColumn` | Helper | Column header with sort toggle |
| `DateColumn` | Helper | Formats date cells |
| `ImageColumn` | Helper | Renders image thumbnails in cells |
| `StatusColumn` | Helper | Renders status badges in cells |
| `ActionColumn` | Helper | Edit link + delete button cell |

### DataTable Props

| Prop | Type | Required | Default |
|---|---|---|---|
| `columns` | `ColumnDef<TData>[]` | Yes | — |
| `data` | `TData[]` | Yes | — |
| `searchPlaceholder` | `string` | No | `"Search..."` |
| `searchable` | `boolean` | No | `true` |
| `showViewOptions` | `boolean` | No | `true` |

### Full Usage Example (Products Table)

```tsx
// app/(admin)/dashboard/products/page.tsx
"use client";

import { DataTable, SortableColumn, ImageColumn, StatusColumn, ActionColumn } from "@/components/ui/data-table";
import { ColumnDef } from "@tanstack/react-table";
import { formatUGX } from "@/lib/format";

type Product = {
  id: string;
  imageUrl: string;
  name: string;
  sku: string;
  category: { name: string };
  price: number;
  isActive: boolean;
};

const columns: ColumnDef<Product>[] = [
  {
    accessorKey: "imageUrl",
    header: "Image",
    cell: ({ row }) => <ImageColumn row={row} accessorKey="imageUrl" />,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <SortableColumn column={column} title="Product" />,
  },
  {
    accessorKey: "sku",
    header: "SKU",
  },
  {
    accessorKey: "category.name",
    header: "Category",
  },
  {
    accessorKey: "price",
    header: ({ column }) => <SortableColumn column={column} title="Price" />,
    cell: ({ row }) => formatUGX(row.original.price),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) => <StatusColumn row={row} accessorKey="isActive" />,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <ActionColumn
        editHref={`/dashboard/products/${row.original.id}/edit`}
        onDelete={() => handleDelete(row.original.id)}
        deleteLabel="Delete product"
      />
    ),
  },
];

export default function ProductsPage() {
  const { data: products = [] } = useQuery({ queryKey: ["products"], queryFn: fetchProducts });

  return (
    <DataTable
      columns={columns}
      data={products}
      searchPlaceholder="Search products..."
    />
  );
}
```

### ActionColumn Props

```tsx
<ActionColumn
  editHref="/dashboard/products/123/edit"   // string — navigates on click
  onDelete={() => deleteProduct(id)}         // () => void — delete handler
  deleteLabel="Delete product"              // string — confirmation label
/>
```

### SortableColumn Props

```tsx
<SortableColumn column={column} title="Product Name" />
```

### StatusColumn

Renders the cell value as a badge. Pair with TPAPOS status badge colors from the style guide.

### DateColumn Props

```tsx
<DateColumn row={row} accessorKey="createdAt" />
```

### Pagination

Built-in. Supports 10, 20, 30, 40, 50 rows per page selector. No additional config needed.

---

## 3. File Storage (Dropzone)

**Registry:** `https://file-storage.desishub.com/r/file-storage.json`  
**Install in:** Phase 4  
**Used for:** Product images, organisation logos

### Available Components

| Export | Purpose |
|---|---|
| `Dropzone` | Multi-variant upload component with R2 integration |
| `FileWithMetadata` | TypeScript interface for uploaded file state |

### Dropzone Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `provider` | `"cloudflare" \| "aws"` | Required | Always `"cloudflare"` in TPAPOS |
| `variant` | `"default" \| "compact" \| "minimal" \| "avatar" \| "inline"` | `"default"` | Visual style |
| `maxFiles` | `number` | `5` | Max files allowed |
| `maxSize` | `number` | `10485760` (10MB) | Max bytes per file |
| `onFilesChange` | `(files: FileWithMetadata[]) => void` | Required | File state callback |
| `accept` | `Record<string, string[]>` | All files | MIME type restrictions |
| `disabled` | `boolean` | `false` | Disables interaction |
| `helperText` | `string` | — | Helper text below dropzone |
| `className` | `string` | — | Custom class |

### FileWithMetadata Interface

```ts
interface FileWithMetadata {
  id: string;
  file: File;
  uploading: boolean;
  progress: number;         // 0–100
  key?: string;             // R2 object key
  provider?: string;        // "cloudflare"
  publicUrl?: string;       // Final public URL (use this to save to DB)
  isDeleting: boolean;
  error: boolean;
  objectUrl?: string;       // Local preview URL
}
```

### Usage Patterns in TPAPOS

**Product image upload (compact):**

```tsx
// Inside product create/edit form
import { Dropzone, FileWithMetadata } from "@/components/ui/dropzone";

const [files, setFiles] = useState<FileWithMetadata[]>([]);

// Get the public URL once upload completes
const imageUrl = files.find(f => f.publicUrl)?.publicUrl ?? null;

<Dropzone
  provider="cloudflare"
  variant="compact"
  maxFiles={1}
  maxSize={5 * 1024 * 1024}  // 5MB
  accept={{ "image/*": [] }}
  onFilesChange={setFiles}
  helperText="PNG or JPG, max 5MB"
/>
```

**Organisation logo upload (avatar):**

```tsx
<Dropzone
  provider="cloudflare"
  variant="avatar"
  maxFiles={1}
  maxSize={2 * 1024 * 1024}  // 2MB
  accept={{ "image/*": [] }}
  onFilesChange={setFiles}
/>
```

### Required API Routes (auto-generated by the component)

The component installs these API routes automatically:

| Route | Method | Purpose |
|---|---|---|
| `/api/r2/upload` | POST | Generate presigned R2 upload URL |
| `/api/r2/delete` | DELETE | Delete file from R2 |

### Environment Variables Required

Use the TPAPOS env var names (mapped to what the component expects):

```env
# The component expects these exact names:
CLOUDFLARE_R2_ACCESS_KEY_ID=        # same as R2_ACCESS_KEY_ID
CLOUDFLARE_R2_SECRET_ACCESS_KEY=    # same as R2_SECRET_ACCESS_KEY
CLOUDFLARE_R2_ENDPOINT=             # https://<account-id>.r2.cloudflarestorage.com
CLOUDFLARE_R2_BUCKET_NAME=          # same as R2_BUCKET_NAME
CLOUDFLARE_R2_PUBLIC_DEV_URL=       # same as R2_PUBLIC_URL
```

> Add both sets of env var names to `.env.local` if the project's other code uses `R2_*` names.

### Saving the URL to Prisma

```ts
// After form submit, save publicUrl to the product record
const imageUrl = files.find(f => !f.uploading && f.publicUrl)?.publicUrl;

await db.product.update({
  where: { id },
  data: { imageUrl },
});
```

---

## 4. Vibekit Form (shadcn Form fallback)

**Registry:** `https://vibekit.desishub.com/r/form.json` *(may return 404 — see fallback)*  
**Install in:** Phase 1  
**Used for:** All forms throughout TPAPOS

### Install

```bash
# Try the registry first:
pnpm dlx shadcn@latest add https://vibekit.desishub.com/r/form.json

# If 404, use the standard shadcn Form:
pnpm dlx shadcn@latest add form
```

### Standard Pattern for All TPAPOS Forms

Every form in TPAPOS follows this structure — React Hook Form + Zod + shadcn Form:

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

// Schema lives in lib/validations/[entity].ts
const productSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sku: z.string().min(1, "SKU is required"),
  price: z.coerce.number().min(0, "Price must be positive"),
  categoryId: z.string().min(1, "Category is required"),
});

type ProductFormValues = z.infer<typeof productSchema>;

export function ProductForm() {
  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: { name: "", sku: "", price: 0, categoryId: "" },
  });

  const onSubmit = async (values: ProductFormValues) => {
    await fetch("/api/products", { method: "POST", body: JSON.stringify(values) });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input placeholder="e.g. Nile Special 500ml" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? "Saving..." : "Save Product"}
        </Button>
      </form>
    </Form>
  );
}
```

### Zod Schema File Convention

All Zod schemas live in `lib/validations/`:

```
lib/validations/
  product.ts
  branch.ts
  user.ts
  supplier.ts
  stock-entry.ts
  sale.ts
  daily-report.ts
  message.ts
  organisation.ts
```

### Select Field Pattern (for dropdowns)

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

<FormField
  control={form.control}
  name="categoryId"
  render={({ field }) => (
    <FormItem>
      <FormLabel>Category</FormLabel>
      <Select onValueChange={field.onChange} defaultValue={field.value}>
        <FormControl>
          <SelectTrigger>
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
        </FormControl>
        <SelectContent>
          {categories.map(cat => (
            <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      <FormMessage />
    </FormItem>
  )}
/>
```

---

## Component Decision Tree

```
Building an auth screen?
  → Use Better Auth UI (<SignIn />, <ForgetPassword />, <ResetPassword />)
  → NEVER build login/password forms from scratch

Building a data table (products, users, sales, etc.)?
  → Use JB DataTable with ColumnDef[]
  → NEVER build table markup from scratch

Uploading a product image or org logo?
  → Use Dropzone with provider="cloudflare"
  → variant="compact" for product images
  → variant="avatar" for logos
  → NEVER use a plain <input type="file">

Building any form?
  → Use React Hook Form + Zod + shadcn Form components
  → Schema in lib/validations/[entity].ts
  → NEVER use useState for form state
  → NEVER use uncontrolled inputs
```
