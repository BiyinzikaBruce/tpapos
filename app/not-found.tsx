import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0B0B18] text-center px-4">
      <p className="text-7xl font-extrabold text-[#7C3AED] mb-4">404</p>
      <h1 className="text-2xl font-bold text-[#F1F0FF] mb-2">Page not found</h1>
      <p className="text-[#A09EC0] mb-8 max-w-sm">
        The page you are looking for does not exist or you do not have access to it.
      </p>
      <Link
        href="/login"
        className="px-5 py-2.5 rounded-lg bg-[#7C3AED] text-white font-semibold text-sm hover:bg-[#6D28D9] transition-colors"
      >
        Back to login
      </Link>
    </div>
  );
}
