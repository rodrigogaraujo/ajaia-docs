import { requireUser } from "@/lib/auth";
import { signOut } from "./login/actions";

export default async function HomePage() {
  const user = await requireUser();

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-4 py-12">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Ajaia Docs</h1>
          <p className="text-sm opacity-70">
            Signed in as {user.name} ({user.email})
          </p>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-lg border border-black/15 px-3 py-2 text-sm transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
          >
            Switch user
          </button>
        </form>
      </header>

      <p className="text-sm opacity-70">
        Documents arrive in the next change.
      </p>
    </main>
  );
}
