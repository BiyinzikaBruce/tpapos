export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0B0B18]">
      <div className="flex items-center gap-3">
        <div
          className="w-6 h-6 rounded-full border-2 border-[#7C3AED] border-t-transparent animate-spin"
        />
        <span className="text-[#A09EC0] text-sm">Loading…</span>
      </div>
    </div>
  );
}
