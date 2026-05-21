import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../lib/generated/prisma/client";
import {
  Role,
  Plan,
  PaymentMethod,
  SaleStatus,
  StockEntryType,
  TransferStatus,
  NotificationType,
  AuditAction,
} from "../lib/generated/prisma/enums";
import { createHash } from "crypto";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const db = new PrismaClient({ adapter });

function hashPassword(plain: string) {
  return createHash("sha256").update(plain).digest("hex");
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log("Seeding TPAPOS...");

  // ── 1. Organisations ─────────────────────────────────────────────────────

  const orgs = await Promise.all([
    db.organisation.create({
      data: {
        name: "Kampala General Store",
        plan: Plan.PRO,
        lowStockThreshold: 10,
      },
    }),
    db.organisation.create({
      data: {
        name: "Nakawa Supermarket",
        plan: Plan.FREE,
        lowStockThreshold: 5,
      },
    }),
  ]);

  const [kgs, nakawa] = orgs;

  // ── 2. Branches ──────────────────────────────────────────────────────────

  const kgsBranches = await Promise.all([
    db.branch.create({ data: { name: "Kampala Main", location: "Kampala CBD, Nakivubo Road", phone: "+256 41 234567", organisationId: kgs.id } }),
    db.branch.create({ data: { name: "Entebbe Branch", location: "Entebbe Road, Katwe", phone: "+256 41 298765", organisationId: kgs.id } }),
    db.branch.create({ data: { name: "Jinja Outlet", location: "Main Street, Jinja", phone: "+256 43 120345", organisationId: kgs.id } }),
    db.branch.create({ data: { name: "Mbarara Store", location: "High Street, Mbarara", phone: "+256 48 532100", organisationId: kgs.id } }),
  ]);

  const nakawaBranches = await Promise.all([
    db.branch.create({ data: { name: "Nakawa HQ", location: "Nakawa Industrial Area, Kampala", phone: "+256 41 445678", organisationId: nakawa.id } }),
    db.branch.create({ data: { name: "Ntinda Branch", location: "Ntinda Shopping Centre, Kampala", phone: "+256 41 512300", organisationId: nakawa.id } }),
    db.branch.create({ data: { name: "Mukono Outlet", location: "Mukono Town, Mukono", phone: "+256 41 609870", organisationId: nakawa.id } }),
  ]);

  // ── 3. Users ─────────────────────────────────────────────────────────────

  const pw = hashPassword("Password123!");

  const kgsUsers = await Promise.all([
    db.user.create({ data: { name: "Robert Ssemakula", email: "admin@kgs.co.ug", passwordHash: pw, role: Role.ADMIN, organisationId: kgs.id, branchId: kgsBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "Grace Namukasa", email: "manager@kgs.co.ug", passwordHash: pw, role: Role.MANAGER, organisationId: kgs.id, branchId: kgsBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "David Ochieng", email: "store@kgs.co.ug", passwordHash: pw, role: Role.STORE_MANAGER, organisationId: kgs.id, branchId: kgsBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "Fatuma Nakato", email: "cashier1@kgs.co.ug", passwordHash: pw, role: Role.CASHIER, organisationId: kgs.id, branchId: kgsBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "Moses Okello", email: "cashier2@kgs.co.ug", passwordHash: pw, role: Role.CASHIER, organisationId: kgs.id, branchId: kgsBranches[1].id, emailVerified: true } }),
    db.user.create({ data: { name: "Sarah Auma", email: "cashier3@kgs.co.ug", passwordHash: pw, role: Role.CASHIER, organisationId: kgs.id, branchId: kgsBranches[2].id, emailVerified: true } }),
    db.user.create({ data: { name: "James Mugisha", email: "cashier4@kgs.co.ug", passwordHash: pw, role: Role.CASHIER, organisationId: kgs.id, branchId: kgsBranches[3].id, emailVerified: true } }),
  ]);

  const nakawaUsers = await Promise.all([
    db.user.create({ data: { name: "Patricia Nansubuga", email: "admin@nakawa.co.ug", passwordHash: pw, role: Role.ADMIN, organisationId: nakawa.id, branchId: nakawaBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "Andrew Byarugaba", email: "manager@nakawa.co.ug", passwordHash: pw, role: Role.MANAGER, organisationId: nakawa.id, branchId: nakawaBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "Immaculate Tendo", email: "store@nakawa.co.ug", passwordHash: pw, role: Role.STORE_MANAGER, organisationId: nakawa.id, branchId: nakawaBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "Emmanuel Kato", email: "cashier1@nakawa.co.ug", passwordHash: pw, role: Role.CASHIER, organisationId: nakawa.id, branchId: nakawaBranches[0].id, emailVerified: true } }),
    db.user.create({ data: { name: "Brenda Namutebi", email: "cashier2@nakawa.co.ug", passwordHash: pw, role: Role.CASHIER, organisationId: nakawa.id, branchId: nakawaBranches[1].id, emailVerified: true } }),
    db.user.create({ data: { name: "Herbert Tumusiime", email: "cashier3@nakawa.co.ug", passwordHash: pw, role: Role.CASHIER, organisationId: nakawa.id, branchId: nakawaBranches[2].id, emailVerified: true } }),
  ]);

  // Super admin (platform owner)
  const superAdmin = await db.user.create({
    data: { name: "Bruce Biyinzika", email: "programmingwithbruce@gmail.com", passwordHash: pw, role: Role.SUPER_ADMIN, emailVerified: true },
  });

  console.log(`Created ${kgsUsers.length + nakawaUsers.length + 1} users`);

  // ── 4. Categories ─────────────────────────────────────────────────────────

  const kgsCats = await Promise.all([
    db.category.create({ data: { name: "Beverages", organisationId: kgs.id } }),
    db.category.create({ data: { name: "Groceries", organisationId: kgs.id } }),
    db.category.create({ data: { name: "Electronics", organisationId: kgs.id } }),
    db.category.create({ data: { name: "Clothing", organisationId: kgs.id } }),
    db.category.create({ data: { name: "Hardware", organisationId: kgs.id } }),
    db.category.create({ data: { name: "Household", organisationId: kgs.id } }),
  ]);

  const nakawaCats = await Promise.all([
    db.category.create({ data: { name: "Beverages", organisationId: nakawa.id } }),
    db.category.create({ data: { name: "Groceries", organisationId: nakawa.id } }),
    db.category.create({ data: { name: "Personal Care", organisationId: nakawa.id } }),
    db.category.create({ data: { name: "Snacks", organisationId: nakawa.id } }),
    db.category.create({ data: { name: "Household", organisationId: nakawa.id } }),
  ]);

  // ── 5. Suppliers ──────────────────────────────────────────────────────────

  const kgsSuppliers = await Promise.all([
    db.supplier.create({ data: { name: "Uganda Breweries Ltd", contactName: "John Mugabi", phone: "+256 41 320000", email: "sales@ubl.co.ug", address: "Port Bell Road, Kampala", organisationId: kgs.id } }),
    db.supplier.create({ data: { name: "Mukwano Industries", contactName: "Ali Hassan", phone: "+256 41 250111", email: "supply@mukwano.com", address: "Mukwano Road, Kampala", organisationId: kgs.id } }),
    db.supplier.create({ data: { name: "Century Bottling (Pepsi)", contactName: "Susan Nanteza", phone: "+256 41 287600", email: "trade@centurypepsi.co.ug", address: "Namanve Industrial Park", organisationId: kgs.id } }),
    db.supplier.create({ data: { name: "Roofings Group", contactName: "Peter Kayiira", phone: "+256 41 590000", email: "orders@roofings.co.ug", address: "Namanve, Kampala", organisationId: kgs.id } }),
    db.supplier.create({ data: { name: "Bidco Uganda", contactName: "Maria Nambi", phone: "+256 41 610700", email: "sales@bidcouganda.com", address: "Jinja Road Industrial Area", organisationId: kgs.id } }),
  ]);

  const nakawaSuppliers = await Promise.all([
    db.supplier.create({ data: { name: "Unilever Uganda", contactName: "Fred Wasswa", phone: "+256 41 230400", email: "orders@unilever.co.ug", address: "Kampala Industrial Area", organisationId: nakawa.id } }),
    db.supplier.create({ data: { name: "Alam Group", contactName: "Raju Patel", phone: "+256 41 343000", email: "trade@alam.co.ug", address: "Entebbe Road, Kampala", organisationId: nakawa.id } }),
    db.supplier.create({ data: { name: "Nile Breweries", contactName: "Tom Mugerwa", phone: "+256 43 122000", email: "sales@nilebreweries.com", address: "Jinja Main Street", organisationId: nakawa.id } }),
    db.supplier.create({ data: { name: "Quality Chemicals", contactName: "Diana Nalwoga", phone: "+256 41 560000", email: "orders@qcil.co.ug", address: "Luzira Industrial Area", organisationId: nakawa.id } }),
  ]);

  // ── 6. Products ───────────────────────────────────────────────────────────

  const kgsProductDefs = [
    // Beverages
    { name: "Bell Lager 500ml", sku: "BEV-001", price: 4000, costPrice: 2800, unit: "bottle", categoryId: kgsCats[0].id },
    { name: "Nile Special 500ml", sku: "BEV-002", price: 4500, costPrice: 3200, unit: "bottle", categoryId: kgsCats[0].id },
    { name: "Pepsi Cola 500ml", sku: "BEV-003", price: 2500, costPrice: 1700, unit: "bottle", categoryId: kgsCats[0].id },
    { name: "Minute Maid Orange 350ml", sku: "BEV-004", price: 2000, costPrice: 1400, unit: "bottle", categoryId: kgsCats[0].id },
    { name: "Rwenzori Water 1.5L", sku: "BEV-005", price: 3000, costPrice: 1900, unit: "bottle", categoryId: kgsCats[0].id },
    // Groceries
    { name: "Golden Penny Spaghetti 500g", sku: "GRO-001", price: 6500, costPrice: 4800, unit: "pkt", categoryId: kgsCats[1].id },
    { name: "Mukwano Cooking Oil 2L", sku: "GRO-002", price: 18000, costPrice: 13500, unit: "btl", categoryId: kgsCats[1].id },
    { name: "Kabras Sugar 2kg", sku: "GRO-003", price: 12000, costPrice: 9000, unit: "bag", categoryId: kgsCats[1].id },
    { name: "Jinja Salt 1kg", sku: "GRO-004", price: 3000, costPrice: 2000, unit: "pkt", categoryId: kgsCats[1].id },
    { name: "Bidco Rice 5kg", sku: "GRO-005", price: 28000, costPrice: 21000, unit: "bag", categoryId: kgsCats[1].id },
    // Electronics
    { name: "Tecno Spark 8 Phone", sku: "ELE-001", price: 450000, costPrice: 360000, unit: "pcs", categoryId: kgsCats[2].id },
    { name: "USB-C Charger 20W", sku: "ELE-002", price: 25000, costPrice: 16000, unit: "pcs", categoryId: kgsCats[2].id },
    { name: "Earphones In-Ear", sku: "ELE-003", price: 15000, costPrice: 9000, unit: "pcs", categoryId: kgsCats[2].id },
    { name: "Phone Case Universal", sku: "ELE-004", price: 8000, costPrice: 4500, unit: "pcs", categoryId: kgsCats[2].id },
    // Clothing
    { name: "Kanzu White Cotton", sku: "CLO-001", price: 55000, costPrice: 38000, unit: "pcs", categoryId: kgsCats[3].id },
    { name: "T-Shirt Plain L", sku: "CLO-002", price: 22000, costPrice: 14000, unit: "pcs", categoryId: kgsCats[3].id },
    { name: "Kitenge Fabric 2 yards", sku: "CLO-003", price: 35000, costPrice: 25000, unit: "yds", categoryId: kgsCats[3].id },
    // Hardware
    { name: "Roofing Nail 2kg", sku: "HRD-001", price: 9500, costPrice: 7000, unit: "bag", categoryId: kgsCats[4].id },
    { name: "PVC Pipe 1 inch 6m", sku: "HRD-002", price: 22000, costPrice: 16000, unit: "pcs", categoryId: kgsCats[4].id },
    { name: "Paint Roller Set", sku: "HRD-003", price: 18500, costPrice: 12000, unit: "set", categoryId: kgsCats[4].id },
    // Household
    { name: "Omo Washing Powder 1kg", sku: "HHD-001", price: 11000, costPrice: 7500, unit: "pkt", categoryId: kgsCats[5].id },
    { name: "Jik Bleach 750ml", sku: "HHD-002", price: 7000, costPrice: 4800, unit: "btl", categoryId: kgsCats[5].id },
    { name: "Canoe Soap Bar 400g", sku: "HHD-003", price: 5500, costPrice: 3800, unit: "bar", categoryId: kgsCats[5].id },
    { name: "Broom Long Handle", sku: "HHD-004", price: 12000, costPrice: 8000, unit: "pcs", categoryId: kgsCats[5].id },
  ];

  const nakawaProductDefs = [
    { name: "Club Pilsner 500ml", sku: "BEV-001", price: 4200, costPrice: 2900, unit: "bottle", categoryId: nakawaCats[0].id },
    { name: "Coca-Cola 330ml", sku: "BEV-002", price: 2500, costPrice: 1600, unit: "can", categoryId: nakawaCats[0].id },
    { name: "Mirinda 500ml", sku: "BEV-003", price: 2500, costPrice: 1600, unit: "bottle", categoryId: nakawaCats[0].id },
    { name: "Mineral Water 500ml", sku: "BEV-004", price: 2000, costPrice: 1200, unit: "bottle", categoryId: nakawaCats[0].id },
    { name: "Maize Flour 2kg (Rolex)", sku: "GRO-001", price: 9000, costPrice: 6800, unit: "bag", categoryId: nakawaCats[1].id },
    { name: "Beans 1kg", sku: "GRO-002", price: 7000, costPrice: 5200, unit: "kg", categoryId: nakawaCats[1].id },
    { name: "Posho Maize Flour 5kg", sku: "GRO-003", price: 22000, costPrice: 17000, unit: "bag", categoryId: nakawaCats[1].id },
    { name: "Vaseline 250ml", sku: "PC-001", price: 8500, costPrice: 5800, unit: "jar", categoryId: nakawaCats[2].id },
    { name: "Colgate Toothpaste 100g", sku: "PC-002", price: 6500, costPrice: 4400, unit: "tube", categoryId: nakawaCats[2].id },
    { name: "Lifebuoy Soap 100g", sku: "PC-003", price: 3500, costPrice: 2300, unit: "bar", categoryId: nakawaCats[2].id },
    { name: "Nice Biscuits 200g", sku: "SNK-001", price: 4500, costPrice: 3000, unit: "pkt", categoryId: nakawaCats[3].id },
    { name: "Kiki Biscuits 150g", sku: "SNK-002", price: 3500, costPrice: 2300, unit: "pkt", categoryId: nakawaCats[3].id },
    { name: "Pringles Crisps 150g", sku: "SNK-003", price: 18000, costPrice: 13000, unit: "can", categoryId: nakawaCats[3].id },
    { name: "Salted Groundnuts 200g", sku: "SNK-004", price: 5000, costPrice: 3400, unit: "pkt", categoryId: nakawaCats[3].id },
    { name: "Plastic Basin Large", sku: "HHD-001", price: 18000, costPrice: 12000, unit: "pcs", categoryId: nakawaCats[4].id },
    { name: "Mosquito Net Single", sku: "HHD-002", price: 22000, costPrice: 15000, unit: "pcs", categoryId: nakawaCats[4].id },
    { name: "Sufuria Aluminium 20cm", sku: "HHD-003", price: 35000, costPrice: 24000, unit: "pcs", categoryId: nakawaCats[4].id },
  ];

  const kgsProducts = await Promise.all(
    kgsProductDefs.map((p) =>
      db.product.create({ data: { ...p, price: p.price, costPrice: p.costPrice, organisationId: kgs.id } })
    )
  );

  const nakawaProducts = await Promise.all(
    nakawaProductDefs.map((p) =>
      db.product.create({ data: { ...p, price: p.price, costPrice: p.costPrice, organisationId: nakawa.id } })
    )
  );

  // ── 7. Product Branch Stock ───────────────────────────────────────────────

  // KGS stocks — some products low at specific branches
  for (const branch of kgsBranches) {
    for (let i = 0; i < kgsProducts.length; i++) {
      const product = kgsProducts[i];
      // Make 5 products per org intentionally low
      const isLow = i >= kgsProducts.length - 5;
      const qty = isLow ? randomBetween(1, 8) : randomBetween(20, 200);
      await db.productBranchStock.create({ data: { productId: product.id, branchId: branch.id, quantity: qty } });
    }
  }

  // Nakawa stocks
  for (const branch of nakawaBranches) {
    for (let i = 0; i < nakawaProducts.length; i++) {
      const product = nakawaProducts[i];
      const isLow = i >= nakawaProducts.length - 5;
      const qty = isLow ? randomBetween(1, 4) : randomBetween(15, 150);
      await db.productBranchStock.create({ data: { productId: product.id, branchId: branch.id, quantity: qty } });
    }
  }

  console.log("Stock levels set");

  // ── 8. Stock Entries ──────────────────────────────────────────────────────

  const kgsStoreManager = kgsUsers[2];
  const nakawaStoreManager = nakawaUsers[2];

  const kgsStockEntries: object[] = [];
  for (let i = 0; i < 30; i++) {
    const product = pick(kgsProducts);
    const branch = pick(kgsBranches);
    const type = i < 20 ? StockEntryType.IN : StockEntryType.OUT;
    kgsStockEntries.push({
      type,
      quantity: randomBetween(10, 100),
      notes: type === StockEntryType.IN ? "Regular restock" : "Customer demand",
      organisationId: kgs.id,
      branchId: branch.id,
      productId: product.id,
      supplierId: type === StockEntryType.IN ? pick(kgsSuppliers).id : undefined,
      userId: kgsStoreManager.id,
      createdAt: daysAgo(randomBetween(1, 30)),
      updatedAt: new Date(),
    });
  }

  // 5 TRANSFER entries for KGS
  for (let i = 0; i < 5; i++) {
    const product = pick(kgsProducts);
    const fromBranch = kgsBranches[0];
    const toBranch = kgsBranches[randomBetween(1, 3)];
    kgsStockEntries.push({
      type: StockEntryType.TRANSFER,
      quantity: randomBetween(5, 30),
      notes: "Inter-branch transfer",
      organisationId: kgs.id,
      branchId: fromBranch.id,
      toBranchId: toBranch.id,
      productId: product.id,
      userId: kgsStoreManager.id,
      transferStatus: pick([TransferStatus.PENDING, TransferStatus.APPROVED]),
      createdAt: daysAgo(randomBetween(1, 14)),
      updatedAt: new Date(),
    });
  }

  await db.stockEntry.createMany({ data: kgsStockEntries as Parameters<typeof db.stockEntry.createMany>[0]["data"] });

  const nakawaStockEntries: object[] = [];
  for (let i = 0; i < 20; i++) {
    const product = pick(nakawaProducts);
    const branch = pick(nakawaBranches);
    const type = i < 15 ? StockEntryType.IN : StockEntryType.OUT;
    nakawaStockEntries.push({
      type,
      quantity: randomBetween(5, 80),
      notes: type === StockEntryType.IN ? "Supplier delivery" : "Sales deduction",
      organisationId: nakawa.id,
      branchId: branch.id,
      productId: product.id,
      supplierId: type === StockEntryType.IN ? pick(nakawaSuppliers).id : undefined,
      userId: nakawaStoreManager.id,
      createdAt: daysAgo(randomBetween(1, 30)),
      updatedAt: new Date(),
    });
  }

  await db.stockEntry.createMany({ data: nakawaStockEntries as Parameters<typeof db.stockEntry.createMany>[0]["data"] });

  console.log("Stock entries created");

  // ── 9. Sales ──────────────────────────────────────────────────────────────

  const kgsCashiers = [kgsUsers[3], kgsUsers[4], kgsUsers[5], kgsUsers[6]];
  const nakawaCashiers = [nakawaUsers[3], nakawaUsers[4], nakawaUsers[5]];
  const paymentMethods = [PaymentMethod.CASH, PaymentMethod.MTN_MOMO, PaymentMethod.AIRTEL_MONEY];

  let kgsSalesCount = 0;
  let kgsSaleItemsCount = 0;

  for (let day = 0; day < 30; day++) {
    const salesThisDay = randomBetween(5, 12);
    for (let s = 0; s < salesThisDay; s++) {
      const cashier = pick(kgsCashiers);
      const branch = cashier.branchId ? kgsBranches.find((b) => b.id === cashier.branchId) ?? kgsBranches[0] : kgsBranches[0];
      const itemCount = randomBetween(1, 5);
      const items: { productId: string; quantity: number; unitPrice: number }[] = [];

      for (let i = 0; i < itemCount; i++) {
        const product = pick(kgsProducts);
        items.push({ productId: product.id, quantity: randomBetween(1, 4), unitPrice: Number(product.price) });
      }

      const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
      const discount = Math.random() < 0.15 ? Math.floor(subtotal * 0.05) : 0;
      const total = subtotal - discount;
      const saleDate = daysAgo(day);

      const sale = await db.sale.create({
        data: {
          organisationId: kgs.id,
          branchId: branch.id,
          cashierId: cashier.id,
          paymentMethod: pick(paymentMethods),
          status: Math.random() < 0.02 ? SaleStatus.VOIDED : SaleStatus.COMPLETED,
          subtotal,
          discount,
          total,
          createdAt: saleDate,
          updatedAt: saleDate,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: it.unitPrice * it.quantity,
            })),
          },
        },
      });

      kgsSalesCount++;
      kgsSaleItemsCount += items.length;
    }
  }

  let nakawaSalesCount = 0;
  let nakawaSaleItemsCount = 0;

  for (let day = 0; day < 30; day++) {
    const salesThisDay = randomBetween(4, 9);
    for (let s = 0; s < salesThisDay; s++) {
      const cashier = pick(nakawaCashiers);
      const branch = cashier.branchId ? nakawaBranches.find((b) => b.id === cashier.branchId) ?? nakawaBranches[0] : nakawaBranches[0];
      const itemCount = randomBetween(1, 4);
      const items: { productId: string; quantity: number; unitPrice: number }[] = [];

      for (let i = 0; i < itemCount; i++) {
        const product = pick(nakawaProducts);
        items.push({ productId: product.id, quantity: randomBetween(1, 6), unitPrice: Number(product.price) });
      }

      const subtotal = items.reduce((sum, it) => sum + it.unitPrice * it.quantity, 0);
      const discount = Math.random() < 0.1 ? Math.floor(subtotal * 0.05) : 0;
      const total = subtotal - discount;
      const saleDate = daysAgo(day);

      await db.sale.create({
        data: {
          organisationId: nakawa.id,
          branchId: branch.id,
          cashierId: cashier.id,
          paymentMethod: pick(paymentMethods),
          status: SaleStatus.COMPLETED,
          subtotal,
          discount,
          total,
          createdAt: saleDate,
          updatedAt: saleDate,
          items: {
            create: items.map((it) => ({
              productId: it.productId,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              total: it.unitPrice * it.quantity,
            })),
          },
        },
      });

      nakawaSalesCount++;
      nakawaSaleItemsCount += items.length;
    }
  }

  console.log(`KGS: ${kgsSalesCount} sales, ${kgsSaleItemsCount} items`);
  console.log(`Nakawa: ${nakawaSalesCount} sales, ${nakawaSaleItemsCount} items`);

  // ── 10. Daily Reports ─────────────────────────────────────────────────────

  for (let day = 0; day < 14; day++) {
    const cashier = pick(kgsCashiers);
    const branch = cashier.branchId ? kgsBranches.find((b) => b.id === cashier.branchId) ?? kgsBranches[0] : kgsBranches[0];
    const totalSales = randomBetween(150000, 900000);
    const cashAmount = Math.floor(totalSales * 0.6);
    const momoAmount = totalSales - cashAmount;
    const reportDate = daysAgo(day);
    reportDate.setHours(0, 0, 0, 0);

    try {
      await db.dailyReport.create({
        data: {
          organisationId: kgs.id,
          branchId: branch.id,
          cashierId: cashier.id,
          date: reportDate,
          totalSales,
          cashAmount,
          momoAmount,
          salesCount: randomBetween(8, 25),
          notes: day % 3 === 0 ? "Busy day — market day nearby" : null,
          isReviewed: day > 3,
          createdAt: reportDate,
          updatedAt: reportDate,
        },
      });
    } catch {
      // skip duplicate date/cashier/branch combos
    }
  }

  for (let day = 0; day < 10; day++) {
    const cashier = pick(nakawaCashiers);
    const branch = cashier.branchId ? nakawaBranches.find((b) => b.id === cashier.branchId) ?? nakawaBranches[0] : nakawaBranches[0];
    const totalSales = randomBetween(100000, 600000);
    const cashAmount = Math.floor(totalSales * 0.55);
    const momoAmount = totalSales - cashAmount;
    const reportDate = daysAgo(day);
    reportDate.setHours(0, 0, 0, 0);

    try {
      await db.dailyReport.create({
        data: {
          organisationId: nakawa.id,
          branchId: branch.id,
          cashierId: cashier.id,
          date: reportDate,
          totalSales,
          cashAmount,
          momoAmount,
          salesCount: randomBetween(6, 20),
          isReviewed: day > 2,
          createdAt: reportDate,
          updatedAt: reportDate,
        },
      });
    } catch {
      // skip duplicates
    }
  }

  console.log("Daily reports created");

  // ── 11. Messages ──────────────────────────────────────────────────────────

  const kgsManager = kgsUsers[1];
  const kgsAdmin = kgsUsers[0];

  const messageData = [
    { senderId: kgsManager.id, recipientId: kgsUsers[3].id, subject: "Reminder: End of day report", body: "Please submit your daily report before 9 PM. Branch target today is UGX 500,000." },
    { senderId: kgsManager.id, recipientId: kgsUsers[4].id, subject: "New promo on beverages", body: "We are running a 5% discount on all beverages this weekend. Please apply at checkout." },
    { senderId: kgsAdmin.id, recipientId: kgsManager.id, subject: "Monthly targets review", body: "Please prepare your branch sales summary for the board meeting on Friday." },
    { senderId: kgsUsers[3].id, recipientId: kgsManager.id, subject: "Low stock alert — Pepsi 500ml", body: "We are almost out of Pepsi 500ml at Kampala Main. Current stock: 4 bottles." },
    { senderId: kgsManager.id, recipientId: kgsUsers[5].id, subject: "Holiday schedule", body: "The Jinja branch will open 2 hours late on Independence Day. Please inform your team." },
    { senderId: kgsUsers[5].id, recipientId: kgsManager.id, subject: "Staff shortage tomorrow", body: "One cashier called in sick. We may need cover at Jinja Outlet tomorrow morning." },
  ];

  await db.message.createMany({ data: messageData });

  // ── 12. Notifications ─────────────────────────────────────────────────────

  const notificationData = [
    { organisationId: kgs.id, userId: kgsAdmin.id, type: NotificationType.LOW_STOCK, title: "Low Stock Alert", body: "Roofing Nail 2kg is below threshold at Kampala Main (stock: 6)." },
    { organisationId: kgs.id, userId: kgsAdmin.id, type: NotificationType.LOW_STOCK, title: "Low Stock Alert", body: "PVC Pipe 1 inch is running low at Entebbe Branch (stock: 3)." },
    { organisationId: kgs.id, userId: kgsAdmin.id, type: NotificationType.NEW_REPORT, title: "Daily Report Submitted", body: "Fatuma Nakato submitted the daily report for Kampala Main — UGX 487,500." },
    { organisationId: kgs.id, userId: kgsAdmin.id, type: NotificationType.TRANSFER_REQUEST, title: "Transfer Request", body: "Transfer of 20 units of Mukwano Cooking Oil from Kampala Main to Jinja Outlet is pending approval." },
    { organisationId: kgs.id, userId: kgsManager.id, type: NotificationType.NEW_MESSAGE, title: "New Message", body: "You have a new message from Fatuma Nakato regarding low stock.", isRead: false },
    { organisationId: nakawa.id, userId: nakawaUsers[0].id, type: NotificationType.LOW_STOCK, title: "Low Stock Alert", body: "Mosquito Net Single is below threshold at Nakawa HQ (stock: 2)." },
    { organisationId: nakawa.id, userId: nakawaUsers[0].id, type: NotificationType.NEW_REPORT, title: "Daily Report Submitted", body: "Emmanuel Kato submitted the daily report for Nakawa HQ — UGX 312,000." },
  ];

  await db.notification.createMany({ data: notificationData });

  // ── 13. Audit Logs ────────────────────────────────────────────────────────

  const auditData = [
    { organisationId: kgs.id, userId: kgsAdmin.id, action: AuditAction.CREATE, entity: "Product", entityId: kgsProducts[10].id, details: { name: "Tecno Spark 8 Phone" } },
    { organisationId: kgs.id, userId: kgsAdmin.id, action: AuditAction.UPDATE, entity: "Product", entityId: kgsProducts[0].id, details: { field: "price", from: 3500, to: 4000 } },
    { organisationId: kgs.id, userId: kgsManager.id, action: AuditAction.VOID, entity: "Sale", entityId: "manual-void-example", details: { reason: "Customer returned items" } },
    { organisationId: kgs.id, userId: kgsStoreManager.id, action: AuditAction.APPROVE, entity: "StockEntry", entityId: "transfer-001", details: { quantity: 20, product: "Mukwano Cooking Oil" } },
    { organisationId: nakawa.id, userId: nakawaUsers[0].id, action: AuditAction.CREATE, entity: "User", entityId: nakawaUsers[3].id, details: { name: "Emmanuel Kato", role: "CASHIER" } },
    { organisationId: nakawa.id, userId: nakawaUsers[0].id, action: AuditAction.UPDATE, entity: "Organisation", entityId: nakawa.id, details: { field: "lowStockThreshold", from: 10, to: 5 } },
  ];

  await db.auditLog.createMany({ data: auditData });

  console.log("Notifications, messages, audit logs created");
  console.log("\n✅ Seed complete!");
  console.log(`\nOrganisations: ${orgs.length}`);
  console.log(`Branches: ${kgsBranches.length + nakawaBranches.length}`);
  console.log(`Users: ${kgsUsers.length + nakawaUsers.length + 1} (including super admin)`);
  console.log(`Products: ${kgsProducts.length + nakawaProducts.length}`);
  console.log(`Suppliers: ${kgsSuppliers.length + nakawaSuppliers.length}`);
  console.log(`KGS Sales: ${kgsSalesCount} | Nakawa Sales: ${nakawaSalesCount}`);
  console.log(`\nTest credentials (all orgs): Password123!`);
  console.log(`Super Admin: programmingwithbruce@gmail.com`);
  console.log(`KGS Admin:   admin@kgs.co.ug`);
  console.log(`Nakawa Admin: admin@nakawa.co.ug`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
