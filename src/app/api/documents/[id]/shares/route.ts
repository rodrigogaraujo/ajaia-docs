import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { canManage } from "@/lib/access";
import { badRequest, conflict, forbidden, notFound, requireApiUser } from "@/lib/api";
import { loadDocumentFor, refusalFor } from "@/lib/document-loader";
import { shareDocumentSchema } from "@/lib/documents";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  ctx: RouteContext<"/api/documents/[id]/shares">,
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { id } = await ctx.params;
  const load = await loadDocumentFor(id, user.id);
  if (load.status !== "found") return refusalFor(load);

  const shares = await prisma.documentShare.findMany({
    where: { documentId: id },
    select: { user: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "asc" },
  });

  const owner = await prisma.user.findUniqueOrThrow({
    where: { id: load.document.ownerId },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json({
    owner,
    shares: shares.map((share) => share.user),
    canManage: canManage(user.id, load.document),
  });
}

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/documents/[id]/shares">,
) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const { id } = await ctx.params;
  const load = await loadDocumentFor(id, user.id);
  if (load.status !== "found") return refusalFor(load);
  if (!canManage(user.id, load.document)) {
    return forbidden("Only the owner can share this document");
  }

  const body = await request.json().catch(() => null);
  const parsed = shareDocumentSchema.safeParse(body ?? {});
  if (!parsed.success) return badRequest("Enter a valid email address");

  const recipient = await prisma.user.findFirst({
    where: { email: { equals: parsed.data.email, mode: "insensitive" } },
    select: { id: true, name: true, email: true },
  });
  if (!recipient) return notFound("No user with that email address");
  if (recipient.id === load.document.ownerId) {
    return badRequest("You already own this document");
  }

  try {
    await prisma.documentShare.create({
      data: { documentId: id, userId: recipient.id },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return conflict("That person already has access");
    }
    throw error;
  }

  return NextResponse.json({ user: recipient }, { status: 201 });
}
