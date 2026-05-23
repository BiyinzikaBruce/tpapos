import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadToR2, isR2Configured } from "@/lib/r2";
import { requirePro } from "@/lib/plan";
import { randomUUID } from "crypto";

export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  const branchId = (session.user as { branchId?: string }).branchId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const role = (session.user as { role?: string }).role;
  const url = new URL(req.url);
  const type = url.searchParams.get("type");
  const branch = url.searchParams.get("branchId");

  // Admins/managers see all branches; cashiers/store-managers see own branch only
  const branchFilter = (role === "ADMIN" || role === "MANAGER")
    ? (branch ? { branchId: branch } : {})
    : { branchId: branchId ?? "" };

  const docs = await db.document.findMany({
    where: {
      organisationId: orgId,
      ...branchFilter,
      ...(type ? { type: type as "CHEQUE" | "RECEIPT" } : {}),
    },
    include: {
      uploadedBy: { select: { name: true, role: true } },
      branch: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(docs);
}

export async function POST(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  const branchId = (session.user as { branchId?: string }).branchId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });
  if (!branchId) return NextResponse.json({ error: "No branch assigned" }, { status: 400 });

  const proCheck = await requirePro(orgId);
  if (!proCheck.ok) return NextResponse.json({ error: proCheck.error, code: "PLAN_LIMIT" }, { status: 403 });

  if (!isR2Configured()) return NextResponse.json({ error: "File storage is not configured. Contact your administrator." }, { status: 503 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const type = formData.get("type") as string;
  const notes = formData.get("notes") as string | null;
  const saleId = formData.get("saleId") as string | null;

  if (!file) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  if (!["CHEQUE", "RECEIPT"].includes(type)) return NextResponse.json({ error: "Invalid type" }, { status: 400 });

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  if (!allowedTypes.includes(file.type)) return NextResponse.json({ error: "Only JPEG, PNG, WebP, or PDF files are allowed" }, { status: 400 });

  const maxSize = 10 * 1024 * 1024; // 10 MB
  if (file.size > maxSize) return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });

  const ext = file.name.split(".").pop() ?? "bin";
  const key = `documents/${orgId}/${branchId}/${randomUUID()}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());

  const fileUrl = await uploadToR2(key, buffer, file.type);

  const doc = await db.document.create({
    data: {
      organisationId: orgId,
      branchId,
      uploadedById: session.user.id,
      type: type as "CHEQUE" | "RECEIPT",
      fileUrl,
      fileName: file.name,
      fileSize: file.size,
      notes: notes || null,
      saleId: saleId || null,
    },
    include: {
      uploadedBy: { select: { name: true, role: true } },
      branch: { select: { name: true } },
    },
  });

  return NextResponse.json(doc, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth.api.getSession({ headers: req.headers });
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const orgId = (session.user as { organisationId?: string }).organisationId;
  if (!orgId) return NextResponse.json({ error: "No org" }, { status: 400 });

  const { id } = await req.json();
  const doc = await db.document.findFirst({ where: { id, organisationId: orgId } });
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await db.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
