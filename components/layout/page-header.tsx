import { NotificationBell } from "./notification-bell";

interface PageHeaderProps {
  title?: string;
  breadcrumb?: string[];
  actions?: React.ReactNode;
}

export function PageHeader({ title, breadcrumb, actions }: PageHeaderProps) {
  return (
    <header
      className="flex items-center justify-between px-6 border-b"
      style={{
        height: "var(--header-height)",
        borderColor: "var(--color-border-subtle)",
        backgroundColor: "var(--color-bg-base)",
      }}
    >
      <div className="flex flex-col justify-center min-w-0">
        {breadcrumb && breadcrumb.length > 0 && (
          <p className="text-[11px] text-[#5C5A7A] mb-0.5">
            {breadcrumb.join(" / ")}
          </p>
        )}
        {title && (
          <h1 className="text-[1.125rem] font-bold text-[#F1F0FF] truncate">
            {title}
          </h1>
        )}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        <NotificationBell />
      </div>
    </header>
  );
}
