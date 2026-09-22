import Link from "next/link";
import { requireUser } from "@/lib/auth";
import { DocumentEditor } from "./document-editor";

export default async function DocumentPage({
  params,
}: PageProps<"/documents/[id]">) {
  await requireUser();
  const { id } = await params;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-4 py-10">
      <Link href="/" className="text-sm opacity-60 transition hover:opacity-100">
        ← All documents
      </Link>
      <DocumentEditor documentId={id} />
    </main>
  );
}
