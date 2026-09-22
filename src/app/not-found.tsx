import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-3 px-4 py-16">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <p className="text-sm opacity-70">
        There is nothing at this address.
      </p>
      <Link href="/" className="text-sm underline">
        Back to your documents
      </Link>
    </main>
  );
}
