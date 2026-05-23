"use client";

import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { format } from "date-fns";
import { Upload, FileText, Image, Trash2, Plus, Receipt, CreditCard, Lock, Zap, Eye } from "lucide-react";
import { formatUGX } from "@/lib/format";
import { cn } from "@/lib/utils";

type Doc = {
  id: string; type: "CHEQUE" | "RECEIPT"; fileUrl: string; fileName: string;
  fileSize: number; notes: string | null; saleId: string | null; createdAt: string;
  uploadedBy: { name: string; role: string };
  branch: { name: string };
};

interface DocumentsClientProps {
  plan: "FREE" | "PRO";
  canUpload: boolean; // cashiers and admins
  orgId: string;
  branchId?: string;
}

export function DocumentsClient({ plan, canUpload, orgId, branchId }: DocumentsClientProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({ type: "RECEIPT", notes: "", saleId: "" });
  const [file, setFile] = useState<File | null>(null);
  const [filterType, setFilterType] = useState<"ALL" | "CHEQUE" | "RECEIPT">("ALL");
  const [preview, setPreview] = useState<Doc | null>(null);

  const { data: docs = [], isLoading } = useQuery<Doc[]>({
    queryKey: ["documents", orgId, filterType],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterType !== "ALL") params.set("type", filterType);
      const res = await fetch(`/api/documents?${params}`);
      if (!res.ok) throw new Error("Failed to load documents");
      return res.json();
    },
  });

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return toast.error("Please select a file");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("type", form.type);
      if (form.notes) fd.append("notes", form.notes);
      if (form.saleId) fd.append("saleId", form.saleId);

      const res = await fetch("/api/documents", { method: "POST", body: fd });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "PLAN_LIMIT") toast.error(data.error, { duration: 6000 });
        else toast.error(data.error ?? "Upload failed");
        return;
      }
      toast.success("Document uploaded successfully");
      queryClient.invalidateQueries({ queryKey: ["documents", orgId] });
      setUploadOpen(false);
      setFile(null);
      setForm({ type: "RECEIPT", notes: "", saleId: "" });
      if (fileRef.current) fileRef.current.value = "";
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this document?")) return;
    const res = await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    if (res.ok) {
      toast.success("Document deleted");
      queryClient.invalidateQueries({ queryKey: ["documents", orgId] });
      if (preview?.id === id) setPreview(null);
    } else {
      toast.error("Failed to delete");
    }
  }

  const isPro = plan === "PRO";
  const isImage = (url: string) => /\.(jpe?g|png|webp)$/i.test(url);

  if (!isPro) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-lg font-bold text-[#F1F0FF] mb-2">PRO Feature</h2>
        <p className="text-sm text-[#A09EC0] max-w-sm mb-4">
          Uploading cheques and payment receipts is available on the PRO plan.
          Contact your super admin to upgrade.
        </p>
        <div className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border bg-amber-500/10 text-amber-400 border-amber-500/20">
          <Zap className="w-3 h-3" /> Upgrade to PRO to unlock
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex gap-1.5">
          {(["ALL", "CHEQUE", "RECEIPT"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setFilterType(t)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-medium transition-colors",
                filterType === t
                  ? "bg-[#7C3AED] text-white"
                  : "bg-[#12122A] text-[#A09EC0] border border-[#2A2A45] hover:text-[#F1F0FF]"
              )}
            >
              {t === "ALL" ? "All" : t === "CHEQUE" ? "Cheques" : "Receipts"}
            </button>
          ))}
        </div>
        {canUpload && (
          <Button onClick={() => setUploadOpen(true)} size="sm" className="ml-auto bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
            <Plus className="w-3.5 h-3.5 mr-1.5" />Upload
          </Button>
        )}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-2">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-lg" />)}</div>
      ) : docs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <FileText className="w-10 h-10 mb-3 opacity-30" />
          <p>No documents uploaded yet</p>
        </div>
      ) : (
        <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#2A2A45" }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-xs text-[#5C5A7A] uppercase tracking-wide"
                style={{ borderColor: "#2A2A45", background: "#12122A" }}>
                <th className="px-4 py-3">File</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Branch</th>
                <th className="px-4 py-3">Uploaded By</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Notes</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc, idx) => (
                <tr key={doc.id}
                  className={cn("transition-colors", idx !== docs.length - 1 && "border-b")}
                  style={{ borderColor: "#2A2A45" }}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {isImage(doc.fileUrl)
                        ? <Image className="w-4 h-4 text-[#7C3AED]" />
                        : <FileText className="w-4 h-4 text-[#A09EC0]" />}
                      <span className="text-[#F1F0FF] truncate max-w-[140px]">{doc.fileName}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge className={cn("text-xs border", doc.type === "CHEQUE"
                      ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30")}>
                      {doc.type === "CHEQUE" ? <><CreditCard className="w-3 h-3 mr-1 inline" />Cheque</> : <><Receipt className="w-3 h-3 mr-1 inline" />Receipt</>}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-[#A09EC0]">{doc.branch.name}</td>
                  <td className="px-4 py-3 text-[#A09EC0]">{doc.uploadedBy.name}</td>
                  <td className="px-4 py-3 text-[#A09EC0]">{format(new Date(doc.createdAt), "dd MMM, HH:mm")}</td>
                  <td className="px-4 py-3 text-[#5C5A7A] max-w-[120px] truncate">{doc.notes ?? "—"}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-[#F1F0FF]"
                        onClick={() => setPreview(doc)}>
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-[#5C5A7A] hover:text-red-400"
                        onClick={() => handleDelete(doc.id)}>
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Upload Sheet */}
      <Sheet open={uploadOpen} onOpenChange={setUploadOpen}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">Upload Document</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Document Type *</Label>
              <div className="grid grid-cols-2 gap-2">
                {(["RECEIPT", "CHEQUE"] as const).map((t) => (
                  <button key={t} type="button"
                    onClick={() => setForm((f) => ({ ...f, type: t }))}
                    className={cn(
                      "flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium transition-colors",
                      form.type === t
                        ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#A78BFA]"
                        : "border-[#2A2A45] bg-[#12122A] text-[#A09EC0] hover:border-[#3A3A60]"
                    )}>
                    {t === "RECEIPT" ? <Receipt className="w-4 h-4" /> : <CreditCard className="w-4 h-4" />}
                    {t === "RECEIPT" ? "Receipt" : "Cheque"}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">File * (JPEG, PNG, WebP, PDF — max 10 MB)</Label>
              <Input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] file:mr-3 file:text-[#A09EC0] file:bg-transparent file:border-0" />
              {file && <p className="text-xs text-[#5C5A7A] mt-1">{file.name} ({(file.size / 1024).toFixed(0)} KB)</p>}
            </div>

            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Sale ID (optional)</Label>
              <Input value={form.saleId} onChange={(e) => setForm((f) => ({ ...f, saleId: e.target.value }))}
                placeholder="Link to a specific sale"
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
            </div>

            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Notes (optional)</Label>
              <Input value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="e.g. Cheque #1234 from Nakawa branch"
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
            </div>

            <Button type="submit" disabled={uploading || !file}
              className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold">
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? "Uploading..." : "Upload Document"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>

      {/* Preview Sheet */}
      <Sheet open={!!preview} onOpenChange={(o) => !o && setPreview(null)}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-lg">
          {preview && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#F1F0FF]">{preview.fileName}</SheetTitle>
                <p className="text-xs text-[#5C5A7A]">{format(new Date(preview.createdAt), "PPpp")}</p>
              </SheetHeader>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-[#A09EC0]">Type</span>
                  <Badge className={cn("text-xs border", preview.type === "CHEQUE"
                    ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                    : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30")}>
                    {preview.type}
                  </Badge>
                </div>
                <div className="flex justify-between"><span className="text-[#A09EC0]">Branch</span><span className="text-[#F1F0FF]">{preview.branch.name}</span></div>
                <div className="flex justify-between"><span className="text-[#A09EC0]">Uploaded by</span><span className="text-[#F1F0FF]">{preview.uploadedBy.name}</span></div>
                <div className="flex justify-between"><span className="text-[#A09EC0]">Size</span><span className="text-[#F1F0FF]">{(preview.fileSize / 1024).toFixed(0)} KB</span></div>
                {preview.notes && <div className="flex justify-between"><span className="text-[#A09EC0]">Notes</span><span className="text-[#F1F0FF]">{preview.notes}</span></div>}
              </div>
              {isImage(preview.fileUrl) ? (
                <img src={preview.fileUrl} alt={preview.fileName} className="w-full rounded-xl border border-[#2A2A45] object-contain max-h-80" />
              ) : (
                <a href={preview.fileUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full h-24 rounded-xl border border-[#2A2A45] bg-[#12122A] text-[#A78BFA] hover:bg-[#18182C] transition-colors">
                  <FileText className="w-6 h-6" />
                  <span className="text-sm font-medium">Open PDF</span>
                </a>
              )}
              <Button variant="outline" size="sm" className="w-full mt-4 border-red-500/30 text-red-400 hover:bg-red-500/10"
                onClick={() => handleDelete(preview.id)}>
                <Trash2 className="w-3.5 h-3.5 mr-2" />Delete Document
              </Button>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
