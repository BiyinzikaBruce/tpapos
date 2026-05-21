"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B18] text-center px-4">
      <p className="text-5xl font-extrabold text-[#F43F5E] mb-4">!</p>
      <h1 className="text-2xl font-bold text-[#F1F0FF] mb-2">Something went wrong</h1>
      <p className="text-[#A09EC0] mb-8 max-w-sm text-sm">
        {error.message || "An unexpected error occurred. Please try again."}
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 rounded-lg bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] transition-colors"
      >
        Try again
      </button>
    </div>
  );
}
