import { prisma } from "@/lib/prisma";
import { signIn } from "./actions";

const ERROR_MESSAGES: Record<string, string> = {
  invalid: "Choose a user to continue.",
  unknown: "That user no longer exists. Pick another.",
};

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { error } = await searchParams;
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });
  const message = typeof error === "string" ? ERROR_MESSAGES[error] : undefined;

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-6 px-4 py-12">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold">Ajaia Docs</h1>
        <p className="text-sm opacity-70">Choose a user to continue.</p>
      </div>

      {message ? (
        <p role="alert" className="text-sm text-red-600">
          {message}
        </p>
      ) : null}

      {users.length === 0 ? (
        <p className="text-sm opacity-70">
          No users yet. Run <code className="font-mono">npm run db:seed</code>.
        </p>
      ) : (
        <ul className="flex flex-col gap-2">
          {users.map((user) => (
            <li key={user.id}>
              <form action={signIn}>
                <input type="hidden" name="userId" value={user.id} />
                <button
                  type="submit"
                  className="w-full rounded-lg border border-black/15 px-4 py-3 text-left transition hover:bg-black/5 dark:border-white/20 dark:hover:bg-white/10"
                >
                  <span className="block font-medium">{user.name}</span>
                  <span className="block text-sm opacity-60">{user.email}</span>
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
