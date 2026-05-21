import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

function toCSV(headers: string[], rows: (string | number | null | undefined)[][]): string {
  const escape = (v: string | number | null | undefined) => {
    const s = String(v ?? "");
    return s.includes(",") || s.includes('"') || s.includes("\n") ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((row) => row.map(escape).join(",")).join("\n");
}

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const branchId = searchParams.get("branchId");

  const branchFilter = branchId ? { branchId } : {};

  if (type === "inventory") {
    const rows = await db.productBranchStock.findMany({
      where: { branch: { organisationId: orgId }, ...(branchId ? { branchId } : {}) },
      include: {
        product: { include: { category: { select: { name: true } } } },
        branch: { select: { name: true } },
      },
      orderBy: [{ branch: { name: "asc" } }, { product: { name: "asc" } }],
    });
    const csv = toCSV(
      ["Branch", "Product", "SKU", "Category", "Unit", "Quantity", "Selling Price", "Cost Price"],
      rows.map((r) => [r.branch.name, r.product.name, r.product.sku, r.product.category.name, r.product.unit, r.quantity, Number(r.product.price), r.product.costPrice ? Number(r.product.costPrice) : ""])
    );
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="inventory.csv"` } });
  }

  if (type === "stock-entries") {
    const rows = await db.stockEntry.findMany({
      where: { organisationId: orgId, ...branchFilter },
      include: {
        product: { select: { name: true, sku: true } },
        branch: { select: { name: true } },
        toBranch: { select: { name: true } },
        supplier: { select: { name: true } },
        user: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });
    const csv = toCSV(
      ["Date", "Type", "Branch", "Product", "SKU", "Quantity", "To Branch", "Supplier", "Staff", "Notes", "Transfer Status"],
      rows.map((r) => [new Date(r.createdAt).toISOString().slice(0, 10), r.type, r.branch.name, r.product.name, r.product.sku, r.quantity, r.toBranch?.name ?? "", r.supplier?.name ?? "", r.user.name, r.notes ?? "", r.transferStatus ?? ""])
    );
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="stock-entries.csv"` } });
  }

  if (type === "sales") {
    const rows = await db.sale.findMany({
      where: { organisationId: orgId, ...branchFilter },
      include: {
        branch: { select: { name: true } },
        cashier: { select: { name: true } },
        items: { include: { product: { select: { name: true } } } },
      },
      orderBy: { createdAt: "desc" },
    });
    const csvRows: (string | number | null)[][] = [];
    for (const s of rows) {
      for (const item of s.items) {
        csvRows.push([new Date(s.createdAt).toISOString().slice(0, 10), s.branch.name, s.cashier.name, s.paymentMethod, item.product.name, item.quantity, Number(item.unitPrice), Number(item.total), Number(s.discount), Number(s.total), s.status]);
      }
    }
    const csv = toCSV(["Date", "Branch", "Cashier", "Payment", "Product", "Qty", "Unit Price", "Line Total", "Discount", "Sale Total", "Status"], csvRows);
    return new NextResponse(csv, { headers: { "Content-Type": "text/csv", "Content-Disposition": `attachment; filename="sales.csv"` } });
  }

  return NextResponse.json({ error: "Invalid type" }, { status: 400 });
}
