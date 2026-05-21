"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, AlertTriangle, FileText, ArrowLeftRight, MessageCircle, CheckCheck } from "lucide-react";
import { format } from "date-fns";

type Notification = { id: string; type: string; title: string; body: string; isRead: boolean; createdAt: Date | string };

const TYPE_ICON: Record<string, React.ReactNode> = {
  LOW_STOCK: <AlertTriangle className="w-4 h-4 text-amber-400" />,
  NEW_REPORT: <FileText className="w-4 h-4 text-blue-400" />,
  TRANSFER_REQUEST: <ArrowLeftRight className="w-4 h-4 text-purple-400" />,
  NEW_MESSAGE: <MessageCircle className="w-4 h-4 text-emerald-400" />,
};

export function NotificationsClient({ initialNotifications }: { initialNotifications: Notification[] }) {
  const [notifications, setNotifications] = useState(initialNotifications);
  const [marking, setMarking] = useState(false);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  async function markAllRead() {
    setMarking(true);
    try {
      const res = await fetch("/api/notifications", { method: "PATCH" });
      if (!res.ok) throw new Error("Failed");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success("All notifications marked as read");
    } catch {
      toast.error("Failed to mark notifications");
    } finally {
      setMarking(false);
    }
  }

  return (
    <>
      <div className="flex items-center justify-between mb-5">
        {unreadCount > 0 && (
          <Badge className="bg-[#7C3AED]/20 text-[#A78BFA] border-[#7C3AED]/30">{unreadCount} unread</Badge>
        )}
        {unreadCount > 0 && (
          <Button size="sm" variant="ghost" onClick={markAllRead} disabled={marking} className="ml-auto h-8 text-xs text-[#5C5A7A] hover:text-[#F1F0FF]">
            <CheckCheck className="w-3.5 h-3.5 mr-1.5" />Mark all read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-[#5C5A7A]">
          <Bell className="w-10 h-10 mb-3 opacity-30" />
          <p>No notifications</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              className="rounded-xl border p-4 flex items-start gap-3 transition-colors"
              style={{ borderColor: n.isRead ? "#1E1E35" : "#2A2A45", background: n.isRead ? "transparent" : "#12122A" }}
            >
              <div className="w-8 h-8 rounded-lg bg-[#1E1E35] flex items-center justify-center flex-shrink-0">
                {TYPE_ICON[n.type] ?? <Bell className="w-4 h-4 text-[#5C5A7A]" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-medium ${n.isRead ? "text-[#A09EC0]" : "text-[#F1F0FF]"}`}>{n.title}</p>
                  <span className="text-xs text-[#3A3A60] flex-shrink-0">{format(new Date(n.createdAt), "MMM d")}</span>
                </div>
                <p className="text-xs text-[#5C5A7A] mt-0.5">{n.body}</p>
              </div>
              {!n.isRead && <div className="w-2 h-2 rounded-full bg-[#7C3AED] flex-shrink-0 mt-1.5" />}
            </div>
          ))}
        </div>
      )}
    </>
  );
}
