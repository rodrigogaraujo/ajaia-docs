import { NextResponse } from "next/server";
import { canManage } from "@/lib/access";
import { badRequest, forbidden, requireApiUser } from "@/lib/api";
import { loadDocumentFor, refusalFor } from "@/lib/document-loader";
import { updateDocumentSchema } from "@/lib/documents";
import { prisma } from "@/lib/prisma";
import { sanitizeDocumentHtml } from "@/lib/sanitize";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/documents/[id]">,
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { id } = await ctx.params;
  const load = await loadDocumentFor(id, user.id);
  if (load.status !== "found") return refusalFor(load);
  const { document } = load;

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
  const load = await loadDocumentFor(id, user.id);
  if (load.status !== "found") return refusalFor(load);

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
  const load = await loadDocumentFor(id, user.id);
  if (load.status !== "found") return refusalFor(load);
  if (!canManage(user.id, load.document)) return forbidden();

  await prisma.document.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
