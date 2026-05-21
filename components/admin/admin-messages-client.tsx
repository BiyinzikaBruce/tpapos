"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, Plus, Send } from "lucide-react";
import { format } from "date-fns";

type User = { id: string; name: string; role: string };
type Message = {
  id: string; subject: string; body: string; isRead: boolean; createdAt: Date | string;
  sender: User; recipient: User;
};

export function AdminMessagesClient({ initialMessages, users, currentUserId }: { initialMessages: Message[]; users: User[]; currentUserId: string }) {
  const [messages, setMessages] = useState(initialMessages);
  const [selected, setSelected] = useState<Message | null>(null);
  const [compose, setCompose] = useState(false);
  const [form, setForm] = useState({ recipientId: "", subject: "", body: "" });
  const [isPending, setIsPending] = useState(false);

  function setField(k: keyof typeof form, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!form.recipientId || !form.subject || !form.body) return toast.error("All fields required");
    setIsPending(true);
    try {
      const res = await fetch("/api/admin/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      const created = await res.json();
      setMessages((prev) => [created, ...prev]);
      setCompose(false);
      setForm({ recipientId: "", subject: "", body: "" });
      toast.success("Message sent");
    } catch {
      toast.error("Failed to send message");
    } finally {
      setIsPending(false);
    }
  }

  return (
    <>
      <div className="flex justify-end mb-5">
        <Button onClick={() => setCompose(true)} size="sm" className="bg-[#7C3AED] hover:bg-[#6D28D9] text-white h-9">
          <Plus className="w-3.5 h-3.5 mr-1.5" />Compose
        </Button>
      </div>

      {messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <MessageCircle className="w-10 h-10 mb-3 opacity-30" />
          <p>No messages yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((m) => {
            const isIncoming = m.recipient.id === currentUserId;
            const other = isIncoming ? m.sender : m.recipient;
            return (
              <div
                key={m.id}
                className="rounded-xl border p-4 cursor-pointer hover:border-[#2A2A45] transition-colors"
                style={{ borderColor: "#1E1E35", background: "#12122A" }}
                onClick={() => setSelected(m)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline" className="border-[#2A2A45] text-[#5C5A7A] text-xs">{isIncoming ? "From" : "To"}: {other.name}</Badge>
                      {isIncoming && !m.isRead && <div className="w-2 h-2 rounded-full bg-[#7C3AED]" />}
                    </div>
                    <p className="text-sm font-medium text-[#F1F0FF] truncate">{m.subject}</p>
                    <p className="text-xs text-[#5C5A7A] truncate mt-0.5">{m.body}</p>
                  </div>
                  <span className="text-xs text-[#3A3A60] flex-shrink-0">{format(new Date(m.createdAt), "MMM d")}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Read message sheet */}
      <Sheet open={!!selected} onOpenChange={() => setSelected(null)}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="mb-5">
                <SheetTitle className="text-[#F1F0FF]">{selected.subject}</SheetTitle>
                <p className="text-xs text-[#5C5A7A]">{format(new Date(selected.createdAt), "MMMM d, yyyy 'at' HH:mm")}</p>
              </SheetHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">From</p><p className="text-[#F1F0FF]">{selected.sender.name}</p></div>
                  <div><p className="text-[#5C5A7A] text-xs mb-0.5">To</p><p className="text-[#F1F0FF]">{selected.recipient.name}</p></div>
                </div>
                <div className="rounded-lg bg-[#12122A] p-4 text-sm text-[#A09EC0] leading-relaxed whitespace-pre-wrap border border-[#2A2A45]">
                  {selected.body}
                </div>
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
              <select value={form.recipientId} onChange={(e) => setField("recipientId", e.target.value)} className="w-full h-10 px-3 rounded-lg bg-[#12122A] border border-[#2A2A45] text-[#F1F0FF] text-sm">
                <option value="">Select recipient</option>
                {users.map((u) => <option key={u.id} value={u.id}>{u.name} ({u.role.replace("_", " ")})</option>)}
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Subject *</Label>
              <Input value={form.subject} onChange={(e) => setField("subject", e.target.value)} placeholder="e.g. Low stock alert" className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60]" />
            </div>
            <div>
              <Label className="text-xs text-[#A09EC0] mb-1.5 block">Message *</Label>
              <Textarea value={form.body} onChange={(e) => setField("body", e.target.value)} placeholder="Type your message..." rows={5} className="bg-[#12122A] border-[#2A2A45] text-[#F1F0FF] placeholder:text-[#3A3A60] resize-none" />
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
