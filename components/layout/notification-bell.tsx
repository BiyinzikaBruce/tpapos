"use client";

import { Bell } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";

export function NotificationBell() {
  const { data } = useQuery<{ unreadCount: number }>({
    queryKey: ["notifications", "unread-count"],
    queryFn: () => fetch("/api/notifications/count").then((r) => r.json()),
    refetchInterval: 60_000,
  });

  const unread = data?.unreadCount ?? 0;

  return (
    <Link
      href="/dashboard/notifications"
      className="relative flex items-center justify-center w-9 h-9 rounded-lg hover:bg-[#18182C] transition-colors"
    >
      <Bell className="w-5 h-5 text-[#A09EC0]" />
      {unread > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-[#F43F5E] text-white text-[10px] font-semibold px-1">
          {unread > 99 ? "99+" : unread}
        </span>
      )}
    </Link>
  );
}
