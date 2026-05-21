"use client";

export default function SuperAdminPageError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-[60vh] p-6">
      <div className="max-w-lg w-full rounded-xl border border-red-500/20 bg-[#12122A] p-8 text-center">
        <p className="text-red-400 font-semibold mb-2">Super Admin Error</p>
        <p className="text-sm text-[#A09EC0] mb-4 font-mono break-all">{error.message}</p>
        {error.digest && (
          <p className="text-xs text-[#5C5A7A] mb-4">Digest: {error.digest}</p>
        )}
        <button
          onClick={reset}
          className="px-4 py-2 rounded-lg bg-[#7C3AED] text-white text-sm"
        >
          Retry
        </button>
      </div>
    </div>
  );
}
