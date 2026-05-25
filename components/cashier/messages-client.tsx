"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Plus, Send } from "lucide-react";
import { cn } from "@/lib/utils";

type AdminUser = { id: string; name: string; role: string };
type Message = {
  id: string; subject: string; body: string; isRead: boolean; createdAt: string;
  sender: { id: string; name: string; role: string };
  recipient?: { id: string; name: string; role: string };
};

export function MessagesClient({ userId, adminUsers }: { userId: string; adminUsers: AdminUser[] }) {
  const [tab, setTab] = useState<"inbox" | "sent">("inbox");
  const [selected, setSelected] = useState<Message | null>(null);
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ recipientId: adminUsers[0]?.id ?? "", subject: "", body: "" });
  const [isPending, setIsPending] = useState(false);
  const queryClient = useQueryClient();

  const { data: inbox = [], isLoading: inboxLoading } = useQuery<Message[]>({
    queryKey: ["messages", userId, "inbox"],
    queryFn: () => fetch("/api/messages").then((r) => r.json()),
  });

  const { data: sent = [], isLoading: sentLoading } = useQuery<Message[]>({
    queryKey: ["messages", userId, "sent"],
    queryFn: () => fetch("/api/messages?sent=true").then((r) => r.json()),
    enabled: tab === "sent",
  });

  const unreadCount = inbox.filter((m) => !m.isRead).length;
  const messages = tab === "inbox" ? inbox : sent;
  const isLoading = tab === "inbox" ? inboxLoading : sentLoading;

  async function openMessage(msg: Message) {
    setSelected(msg);
    if (tab === "inbox" && !msg.isRead) {
      await fetch(`/api/messages/${msg.id}`, { method: "PATCH" });
      queryClient.setQueryData<Message[]>(["messages", userId, "inbox"], (prev) =>
        prev?.map((m) => m.id === msg.id ? { ...m, isRead: true } : m) ?? []
      );
    }
  }

  function setField(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.recipientId || !form.subject || !form.body) return toast.error("All fields required");
    setIsPending(true);
    try {
      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      queryClient.setQueryData<Message[]>(["messages", userId, "sent"], (prev) =>
        prev ? [created, ...prev] : [created]
      );
      setCompose(false);
      setForm({ recipientId: adminUsers[0]?.id ?? "", subject: "", body: "" });
      toast.success("Message sent");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      {/* Tab bar + Compose */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex gap-1 bg-[#12122A] rounded-lg p-1 border border-[#2A2A45]">
          <button
            onClick={() => setTab("inbox")}
            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", tab === "inbox" ? "bg-[#7C3AED] text-white" : "text-[#5C5A7A] hover:text-[#F1F0FF]")}
          >
            Inbox
            {unreadCount > 0 && (
              <span className="ml-1.5 bg-white/20 text-white text-xs rounded-full px-1.5 py-0.5">{unreadCount}</span>
            )}
          </button>
          <button
            onClick={() => setTab("sent")}
            className={cn("px-4 py-1.5 rounded-md text-sm font-medium transition-colors", tab === "sent" ? "bg-[#7C3AED] text-white" : "text-[#5C5A7A] hover:text-[#F1F0FF]")}
          >
            Sent
          </button>
        </div>
        {adminUsers.length > 0 && (
          <Button onClick={() => setCompose(true)} size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
            <Plus className="w-3.5 h-3.5 mr-1.5" />New Message
          </Button>
        )}
      </div>

      {/* Message list */}
      {isLoading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
          <p>{tab === "inbox" ? "No messages yet" : "No sent messages yet"}</p>
          {tab === "inbox" && adminUsers.length > 0 && (
            <button onClick={() => setCompose(true)} className="mt-3 text-sm text-[#7C3AED] hover:text-[#A78BFA]">Send a message →</button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => {
            const other = tab === "inbox" ? msg.sender : msg.recipient;
            return (
              <button
                key={msg.id}
                onClick={() => openMessage(msg)}
                className={cn(
                  "w-full text-left p-4 rounded-xl border transition-colors",
                  tab === "inbox" && !msg.isRead
                    ? "border-[#7C3AED]/40 bg-[#12122A]"
                    : "border-[#1E1E35] bg-[#0D0D1A] hover:bg-[#12122A]"
                )}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      {tab === "inbox" && !msg.isRead && <span className="w-2 h-2 rounded-full bg-[#7C3AED] flex-shrink-0" />}
                      <p className={cn("text-sm font-medium truncate", tab === "inbox" && !msg.isRead ? "text-[#F1F0FF]" : "text-[#A09EC0]")}>
                        {msg.subject}
                      </p>
                    </div>
                    <p className="text-xs text-[#5C5A7A]">
                      {tab === "inbox" ? "From" : "To"}: {other?.name ?? "—"}
                    </p>
                    <p className="text-xs text-[#5C5A7A] line-clamp-1 mt-0.5">{msg.body}</p>
                  </div>
                  <span className="text-[10px] text-[#3A3A60] flex-shrink-0">
                    {format(new Date(msg.createdAt), "MMM d")}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Read message sheet */}
      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#F1F0FF] leading-snug">{selected.subject}</SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-[#1E1E35] text-[#A09EC0] border-[#2A2A45] text-xs">
                    {tab === "inbox" ? `From: ${selected.sender.name}` : `To: ${selected.recipient?.name ?? "—"}`}
                  </Badge>
                  <span className="text-[10px] text-[#5C5A7A]">
                    {format(new Date(selected.createdAt), "PPp")}
                  </span>
                </div>
              </SheetHeader>
              <div className="rounded-lg bg-[#12122A] border border-[#2A2A45] p-4 text-sm text-[#A09EC0] leading-relaxed whitespace-pre-wrap">
                {selected.body}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Compose sheet */}
      <Sheet open={compose} onOpenChange={setCompose}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          <SheetHeader className="mb-5">
            <SheetTitle className="text-[#F1F0FF]">New Message</SheetTitle>
          </SheetHeader>
          <form onSubmit={handleSend} className="space-y-4">
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">To *</Label>
              <select
                value={form.recipientId}
                onChange={(e) => setField("recipientId", e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm"
              >
                {adminUsers.map((u) => (
                  <option key={u.id} value={u.id}>{u.name} ({u.role.replace("_", " ")})</option>
                ))}
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Subject *</Label>
              <Input
                value={form.subject}
                onChange={(e) => setField("subject", e.target.value)}
                placeholder="e.g. Stock issue at counter"
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]"
              />
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Message *</Label>
              <Textarea
                value={form.body}
                onChange={(e) => setField("body", e.target.value)}
                placeholder="Type your message..."
                rows={5}
                className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60] resize-none"
              />
            </div>
            <Button type="submit" disabled={isPending} className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-11 font-semibold">
              <Send className="w-4 h-4 mr-2" />
              {isPending ? "Sending..." : "Send Message"}
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
