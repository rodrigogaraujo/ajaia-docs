import type { Document, User } from "@prisma/client";
import { canAccess } from "@/lib/access";
import { forbidden, notFound } from "@/lib/api";
import { prisma } from "@/lib/prisma";

export type LoadedDocument = Document & {
  owner: Pick<User, "name">;
  shares: { documentId: string; userId: string }[];
};

export type DocumentLoad =
  | { status: "found"; document: LoadedDocument }
  | { status: "missing" }
  | { status: "forbidden" };

export async function loadDocumentFor(
  id: string,
  userId: string,
): Promise<DocumentLoad> {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      shares: { select: { documentId: true, userId: true } },
    },
  });

  if (!document) return { status: "missing" };
  if (!canAccess(userId, document, document.shares)) {
    return { status: "forbidden" };
  }
  return { status: "found", document };
}

export function refusalFor(load: Exclude<DocumentLoad, { status: "found" }>) {
  return load.status === "missing" ? notFound() : forbidden();
}
