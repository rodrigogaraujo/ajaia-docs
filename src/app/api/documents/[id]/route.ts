import { NextResponse } from "next/server";
import { canAccess, canManage } from "@/lib/access";
import { badRequest, forbidden, notFound, requireApiUser } from "@/lib/api";
import { updateDocumentSchema } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { sanitizeDocumentHtml } from "@/lib/sanitize";

async function loadReadable(id: string, userId: string) {
  const document = await prisma.document.findUnique({
    where: { id },
    include: {
      owner: { select: { name: true } },
      shares: { select: { documentId: true, userId: true } },
    },
  });
  if (!document) return null;
  if (!canAccess(userId, document, document.shares)) return null;
  return document;
}

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { id } = await ctx.params;
  const document = await loadReadable(id, user.id);
  if (!document) return notFound();

  return NextResponse.json({
    document: {
      id: document.id,
      title: document.title,
      contentHtml: document.contentHtml,
      ownerName: document.owner.name,
      updatedAt: document.updatedAt,
      role: canManage(user.id, document) ? "owner" : "shared",
    },
  });
}

export async function PATCH(
  request: Request,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { id } = await ctx.params;
  const document = await loadReadable(id, user.id);
  if (!document) return notFound();

  const body = await request.json().catch(() => null);
  const parsed = updateDocumentSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return badRequest(parsed.error.issues[0]?.message ?? "Invalid update");
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      ...(parsed.data.title !== undefined ? { title: parsed.data.title } : {}),
      ...(parsed.data.contentHtml !== undefined
        ? { contentHtml: sanitizeDocumentHtml(parsed.data.contentHtml) }
        : {}),
    },
    select: { id: true, title: true, contentHtml: true, updatedAt: true },
  });

  return NextResponse.json({ document: updated });
}

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { id } = await ctx.params;
  const document = await loadReadable(id, user.id);
  if (!document) return notFound();
  if (!canManage(user.id, document)) return forbidden();

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
