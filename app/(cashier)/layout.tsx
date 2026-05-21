export default function CashierLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0B0B18] flex flex-col">
      {children}
    </div>
  );
}
