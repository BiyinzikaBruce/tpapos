# TPAPOS — Project Description

## What This App Does
TPAPOS is a multi-tenant, cloud-based Point of Sale and business management SaaS platform built for Ugandan businesses. It enables business owners to manage multiple branches, track sales in UGX across cash and mobile money channels, monitor inventory with full stock transfer and supplier management, and analyse performance through rich analytics dashboards. Each client organisation gets a fully isolated data environment within the shared platform.

## Target Users
- **Primary user (Admin/Owner):** The business owner or administrator who needs full visibility across all branches — managing users, products, stock, reports, and overall business analytics.
- **Secondary users:**
  - **Manager:** Oversees operations across multiple branches, monitors sales performance, and communicates with cashiers.
  - **Cashier:** Front-line staff who record daily sales transactions and submit end-of-day reports to admin.
  - **Store Manager:** Manages physical inventory — recording stock entries, handling supplier orders, processing inter-branch stock transfers, and exporting stock lists.

## Core Value Proposition
TPAPOS gives Ugandan multi-branch businesses a single, affordable platform to run their entire POS operation — from cashier to boardroom analytics — without needing separate tools for sales, stock, and reporting.

## User Roles & Permissions

- **Super Admin (Platform Owner — you):** Can onboard new tenant organisations, manage plans, and access all tenants. Not visible to clients.
- **Admin/Owner:** Full access to their organisation — branches, users, products, inventory, analytics, reports, settings.
- **Manager:** Read access across all branches in their organisation; can view sales, reports, and analytics; can send messages to cashiers; cannot manage users or billing.
- **Store Manager:** Can record stock entries (in/out), initiate inter-branch stock transfers, manage suppliers, and export stock lists. Cannot view financial analytics.
- **Cashier:** Can open the POS screen to record sales, view their own transaction history for the day, and submit a daily sales report to admin.

## Features — Complete List

1. **Multi-Tenant Organisation Management** — Each client is an isolated Organisation with its own users, branches, products, and data. Super admin can create and manage organisations from a platform-level dashboard.
2. **Branch Management** — Admin can create and manage multiple branches (name, location, phone, assigned users). Each branch operates independently within the organisation.
3. **User Management** — Admin can invite users by email, assign roles (Manager, Store Manager, Cashier), and assign them to specific branches. Users receive a welcome email with login credentials.
4. **POS Sales Screen (Cashier)** — Full-screen POS interface: product search/browse by category, add to cart, apply discounts, select payment method (Cash / MTN MoMo / Airtel Money), confirm sale, and print/export receipt.
5. **Payment Method Tracking** — Every sale records the payment method used (Cash, MTN MoMo, Airtel Money) with amounts in UGX. Split payments not supported in v1.
6. **Transaction History (Cashier)** — Cashier can view all their own sales for the current day, with sale details, items, and payment method.
7. **Daily Report Submission** — Cashier can submit an end-of-day report (total sales, cash amount, mobile money amount, notes) that is sent to the branch admin via in-app notification and email.
8. **Product & Category Management** — Admin can create products with name, SKU, category, price (UGX), unit of measure, and product image (uploaded to Cloudflare R2). Products belong to the organisation and are available across all branches.
9. **Advanced Inventory Management** — Store Manager records stock entries (IN from supplier, OUT for loss/damage, TRANSFER to another branch). Current stock level per product per branch is always calculated. Low-stock alerts trigger when stock falls below a configurable threshold.
10. **Supplier Management** — Store Manager can create and manage suppliers (name, contact person, phone, email, address). Stock-in entries are linked to a supplier.
11. **Inter-Branch Stock Transfers** — Store Manager initiates a transfer request (product, quantity, from-branch, to-branch). Receiving branch Store Manager approves it, which updates stock levels on both sides.
12. **Stock Export** — Store Manager can export the current stock list as Excel (.xlsx) or PDF. Export includes product name, SKU, category, current stock, unit, branch, and last updated date.
13. **Sales Analytics Dashboard (Admin/Manager)** — Rich analytics with: total revenue over time (area chart), sales by branch (bar chart), sales by product/category (donut chart), payment method breakdown, top-performing products, and date range filters (today / week / month / custom).
14. **Branch Comparison Reports** — Admin can compare sales performance across branches side-by-side with charts and summary tables.
15. **Internal Messaging** — Manager can send messages to individual cashiers or broadcast to all cashiers in a branch. Cashiers can read messages in their inbox. No reply threading in v1.
16. **Notifications Centre** — In-app notification bell for: daily report received, low stock alert, stock transfer request, new message received.
17. **Audit Log** — Admin can view a log of all significant actions (user created, sale voided, stock transfer approved, report submitted) with timestamp and actor.
18. **Organisation Settings** — Admin can update organisation name, logo (R2 upload), currency display (UGX default), and configure low-stock threshold globally.
19. **Super Admin Platform Dashboard** — You (the SaaS owner) can view all organisations, create new ones, impersonate admin accounts for support, and see platform-wide stats.

## Data Model

- **Organisation:** id, name, logoUrl, plan(FREE/PRO), lowStockThreshold, createdAt
- **Branch:** id, name, location, phone, organisationId, createdAt
- **User:** id, name, email, passwordHash, role(SUPER_ADMIN/ADMIN/MANAGER/STORE_MANAGER/CASHIER), branchId(nullable), organisationId(nullable), createdAt
- **Product:** id, name, sku, categoryId, price(Decimal), unit, imageUrl, organisationId, isActive, createdAt
- **Category:** id, name, organisationId
- **Supplier:** id, name, contactPerson, phone, email, address, organisationId
- **StockEntry:** id, productId, branchId, type(IN/OUT/TRANSFER_OUT/TRANSFER_IN), quantity, supplierId(nullable), transferToBranchId(nullable), transferStatus(PENDING/APPROVED/REJECTED, nullable), notes, createdById, createdAt
- **Sale:** id, cashierId, branchId, organisationId, total(Decimal), paymentMethod(CASH/MTN_MOMO/AIRTEL_MONEY), discount(Decimal), status(COMPLETED/VOIDED), createdAt
- **SaleItem:** id, saleId, productId, quantity, unitPrice(Decimal), subtotal(Decimal)
- **DailyReport:** id, cashierId, branchId, date, totalSales(Decimal), cashAmount(Decimal), mobileMoneyAmount(Decimal), transactionCount, notes, submittedAt
- **Message:** id, senderId, recipientId(nullable), branchId(nullable), subject, body, isRead, createdAt
- **Notification:** id, userId, type, message, isRead, relatedId, createdAt
- **AuditLog:** id, userId, organisationId, action, entity, entityId, metadata(Json), createdAt

**Relationships:**
- Organisation has many Branches, Users, Products, Categories, Suppliers
- Branch belongs to Organisation; has many Users, Sales, StockEntries
- User belongs to Organisation and optionally a Branch
- Sale belongs to Branch, Organisation, and a User (cashier); has many SaleItems
- SaleItem belongs to Sale and Product
- StockEntry belongs to Branch and Product; optionally to Supplier
- DailyReport belongs to User (cashier) and Branch
- Message belongs to sender (User); optionally to a recipient User or a Branch

## Pages / Screens

### Public / Auth
1. `/` — Marketing landing page (hero, features, pricing tiers, CTA to contact you)
2. `/login` — Email + password login, role-aware redirect after auth
3. `/forgot-password` — Password reset request
4. `/reset-password` — Password reset with token

### Super Admin (`/super-admin/...`)
5. `/super-admin` — Platform dashboard (total orgs, total users, total sales today)
6. `/super-admin/organisations` — List all organisations, create new organisation
7. `/super-admin/organisations/[id]` — Organisation detail, impersonate admin

### Admin Dashboard (`/dashboard/...`)
8. `/dashboard` — Main analytics dashboard (revenue chart, branch comparison, top products, payment breakdown, stat cards)
9. `/dashboard/branches` — List and manage branches
10. `/dashboard/branches/[id]` — Branch detail (sales, staff, stock summary)
11. `/dashboard/users` — User management (list, invite, assign role/branch, deactivate)
12. `/dashboard/products` — Product list with search, filters, image
13. `/dashboard/products/new` — Create product form
14. `/dashboard/products/[id]/edit` — Edit product
15. `/dashboard/categories` — Category management
16. `/dashboard/inventory` — Stock overview across all branches (table + low-stock alerts)
17. `/dashboard/inventory/transfers` — Stock transfer requests (approve/reject)
18. `/dashboard/suppliers` — Supplier list and management
19. `/dashboard/sales` — All sales across branches (filterable by branch, date, payment method)
20. `/dashboard/sales/[id]` — Sale detail / receipt view
21. `/dashboard/reports` — All submitted daily reports (filterable by branch, cashier, date)
22. `/dashboard/analytics` — Deep analytics (branch comparison charts, product performance, date range picker)
23. `/dashboard/messages` — Message inbox + compose
24. `/dashboard/notifications` — All notifications
25. `/dashboard/audit-log` — Full audit log table
26. `/dashboard/settings` — Organisation settings (name, logo, low-stock threshold)

### Manager Dashboard (subset of above, read-only analytics + messaging)
27. `/manager/dashboard` — Manager analytics view (all branches)
28. `/manager/sales` — Sales across branches (read-only)
29. `/manager/reports` — Submitted daily reports
30. `/manager/messages` — Compose + inbox (send to cashiers)
31. `/manager/analytics` — Charts and branch comparison

### Cashier Interface (`/cashier/...`)
32. `/cashier` — POS sales screen (full-screen, product grid, cart, checkout)
33. `/cashier/history` — Today's transaction history
34. `/cashier/report` — Submit daily report form
35. `/cashier/messages` — Read-only inbox (messages from manager)

### Store Manager (`/store/...`)
36. `/store/inventory` — Stock levels for assigned branch
37. `/store/inventory/entry` — Record stock in/out form
38. `/store/inventory/transfers` — Initiate + manage transfer requests
39. `/store/suppliers` — Supplier management
40. `/store/export` — Export stock list (Excel / PDF)

## Integrations
- **Auth:** Better Auth, email/password only (no OAuth)
- **Email:** Resend — welcome email on user invite, daily report notification to admin, low-stock alert email to admin/store manager
- **Payments:** None (sales recorded in UGX, no payment gateway)
- **File uploads:** Cloudflare R2 — product images, organisation logos, branch photos
- **AI features:** None in v1
- **Dark mode:** YES — dark-only, no light mode. No ThemeProvider/next-themes toggle needed; apply dark styles globally in globals.css

## JB Components to Install

- **Better Auth UI:** `pnpm dlx shadcn@latest add https://better-auth-ui.desishub.com/r/auth-components.json`
- **Data Table:** `pnpm dlx shadcn@latest add https://jb.desishub.com/r/data-table.json`
- **File Storage UI (R2):** `pnpm dlx shadcn@latest add https://file-storage.desishub.com/r/file-storage.json`
- **Form (shadcn fallback):** `pnpm dlx shadcn@latest add https://vibekit.desishub.com/r/form.json`

## Out of Scope (v1)
- Mobile app (iOS / Android)
- Receipt printing / thermal printer / Bluetooth printer integration
- Customer loyalty points or CRM features
- Stripe or DGateway payment processing (sales are recorded manually)
- Self-serve tenant signup (you onboard clients manually via super admin)
- Barcode / QR code scanning
- Offline / PWA mode
- Multi-currency support (UGX only)
- Split payment (two methods per sale)
- SMS notifications
- Reply threading in messages
