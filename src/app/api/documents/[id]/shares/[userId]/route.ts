import { NextResponse } from "next/server";
import { canManage } from "@/lib/access";
import { forbidden, notFound, requireApiUser } from "@/lib/api";
import { loadDocumentFor, refusalFor } from "@/lib/document-loader";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  ctx: RouteContext<"/api/documents/[id]/shares/[userId]">,
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { id, userId } = await ctx.params;
  const load = await loadDocumentFor(id, user.id);
  if (load.status !== "found") return refusalFor(load);
  if (!canManage(user.id, load.document)) {
    return forbidden("Only the owner can change who has access");
  }

  const existing = await prisma.documentShare.findUnique({
    where: { documentId_userId: { documentId: id, userId } },
  });
  if (!existing) return notFound("That person does not have access");

  await prisma.documentShare.delete({
    where: { documentId_userId: { documentId: id, userId } },
  });

  return NextResponse.json({ ok: true });
}
