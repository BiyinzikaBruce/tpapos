"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type Message = {
  id: string;
  subject: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  sender: { id: string; name: string; role: string };
};

export function MessagesClient({ userId }: { userId: string }) {
  const [selected, setSelected] = useState<Message | null>(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["messages", userId],
    queryFn: async () => {
      const res = await fetch("/api/messages");
      if (!res.ok) throw new Error("Failed to load messages");
      return res.json();
    },
  });

  async function openMessage(msg: Message) {
    setSelected(msg);
    if (!msg.isRead) {
      await fetch(`/api/messages/${msg.id}`, { method: "PATCH" });
      queryClient.setQueryData<Message[]>(["messages", userId], (prev) =>
        prev?.map((m) => m.id === msg.id ? { ...m, isRead: true } : m) ?? []
      );
    }
  }

  const unreadCount = messages.filter((m) => !m.isRead).length;

  return (
    <>
      {unreadCount > 0 && (
        <div className="mb-4 text-sm text-[#A09EC0]">
          <span className="font-semibold text-[#7C3AED]">{unreadCount}</span> unread message{unreadCount !== 1 ? "s" : ""}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}
        </div>
      ) : messages.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <MessageCircle className="w-12 h-12 mb-3 opacity-30" />
          <p>No messages yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg) => (
            <button
              key={msg.id}
              onClick={() => openMessage(msg)}
              className={cn(
                "w-full text-left p-4 rounded-xl border transition-colors",
                !msg.isRead
                  ? "border-[#7C3AED]/40 bg-[#12122A]"
                  : "border-[#1E1E35] bg-[#0D0D1A] hover:bg-[#12122A]"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    {!msg.isRead && <span className="w-2 h-2 rounded-full bg-[#7C3AED] flex-shrink-0" />}
                    <p className={cn("text-sm font-medium truncate", !msg.isRead ? "text-[#F1F0FF]" : "text-[#A09EC0]")}>
                      {msg.subject}
                    </p>
                  </div>
                  <p className="text-xs text-[#5C5A7A]">
                    From: {msg.sender.name} · {msg.sender.role.toLowerCase().replace("_", " ")}
                  </p>
                  <p className="text-xs text-[#5C5A7A] line-clamp-1 mt-0.5">{msg.body}</p>
                </div>
                <span className="text-[10px] text-[#3A3A60] flex-shrink-0">
                  {format(new Date(msg.createdAt), "MMM d")}
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="bg-[#0D0D1A] border-[#2A2A45] text-[#F1F0FF] w-full sm:max-w-md">
          {selected && (
            <>
              <SheetHeader className="mb-4">
                <SheetTitle className="text-[#F1F0FF] leading-snug">{selected.subject}</SheetTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className="bg-[#1E1E35] text-[#A09EC0] border-[#2A2A45] text-xs">
                    {selected.sender.name}
                  </Badge>
                  <span className="text-[10px] text-[#5C5A7A]">
                    {format(new Date(selected.createdAt), "PPp")}
                  </span>
                </div>
              </SheetHeader>
              <p className="text-sm text-[#A09EC0] leading-relaxed whitespace-pre-wrap">{selected.body}</p>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  );
}
