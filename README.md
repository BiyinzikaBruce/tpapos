<div align="center">

# 🏪 TPAPOS

**Run every branch. Own every sale.**

A multi-branch point-of-sale and business management platform built for fast-growing local businesses: sales, inventory, suppliers, staff and reports in one place.

![Next.js](https://img.shields.io/badge/Next.js_16-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?style=flat-square&logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma_7-2D3748?style=flat-square&logo=prisma&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)
![AWS S3](https://img.shields.io/badge/S3-569A31?style=flat-square&logo=amazons3&logoColor=white)

</div>

---

## ✨ Why TPAPOS

Growing businesses with more than one shop struggle to see stock, sales and staff across locations. TPAPOS gives owners a live view of every branch while giving each staff member exactly the tools their job needs.

## 👥 Built for every role

| Role | What they can do |
|---|---|
| **Super Admin** | Manage organisations on the platform |
| **Owner / Admin** | Branches, products, categories, users, sales, analytics, reports, documents, settings |
| **Manager** | Branch dashboard, sales, analytics, reports, team messages |
| **Store Keeper** | Inventory, stock entry, transfers between branches, suppliers, exports |
| **Cashier** | Point of sale, sales history, daily report, documents, messages |

## 🚀 Features

- 🧾 **Point of sale:** fast checkout for cashiers
- 🏢 **Multi-branch & multi-organisation:** stock tracked per product per branch
- 📦 **Inventory:** stock entries, transfers between branches, supplier records
- 📊 **Analytics & reports:** sales charts, daily reports, exports
- 💬 **Messages & notifications** between staff
- 📁 **Documents:** upload and share files (S3)
- 🛡️ **Audit log** of important actions
- 🔐 **Auth:** sign-up, email verification, OTP, password reset, role-based access

## 🛠️ Tech Stack

| Layer | Tools |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Database | PostgreSQL + Prisma 7 |
| Auth | Better Auth |
| UI | Tailwind CSS 4, Radix, Lucide, Framer Motion, Recharts |
| Data | TanStack Query, React Hook Form, Zod |
| Services | AWS S3, Resend + React Email, Upstash Redis |

## ⚡ Getting Started

```bash
git clone https://github.com/BiyinzikaBruce/tpapos.git
cd tpapos
pnpm install

cp .env.example .env      # fill in your values
pnpm db:push
pnpm db:seed              # optional: sample data
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

See [`.env.example`](./.env.example): database, Better Auth, Resend, Upstash Redis and S3 storage keys.

📘 Not sure where to get these? See my [Environment Variables Cheatsheet](https://biyinzikabruce.github.io/env-cheatsheet/).

### Scripts

| Command | What it does |
|---|---|
| `pnpm dev` | Start the dev server |
| `pnpm build` | Production build |
| `pnpm db:push` | Sync the Prisma schema |
| `pnpm db:seed` | Seed sample data |
| `pnpm db:studio` | Open Prisma Studio |

## 📁 Project Structure

```
app/
  (super-admin)/   # platform organisations
  dashboard/       # owner / admin
  (manager)/       # branch managers
  (store)/         # inventory, transfers, suppliers
  (cashier)/       # point of sale
  (auth)/          # sign-in, sign-up, OTP, password reset
components/  hooks/  lib/  prisma/
```

---

<div align="center">

Built by **[Biyinzika Bruce](https://github.com/BiyinzikaBruce)** · Tech Power Africa

</div>
