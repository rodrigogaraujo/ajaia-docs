import { NextResponse } from "next/server";
import { badRequest, requireApiUser } from "@/lib/api";
import {
  DEFAULT_DOCUMENT_TITLE,
  createDocumentSchema,
  documentListSelect,
} from "@/lib/documents";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const [owned, shared] = await Promise.all([
    prisma.document.findMany({
      where: { ownerId: user.id },
      select: documentListSelect,
      orderBy: { updatedAt: "desc" },
    }),
    prisma.document.findMany({
      where: { shares: { some: { userId: user.id } } },
      select: documentListSelect,
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  return NextResponse.json({
    documents: [
      ...owned.map((doc) => ({ ...doc, role: "owner" as const })),
      ...shared.map((doc) => ({ ...doc, role: "shared" as const })),
    ],
  });
}

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const body = await request.json().catch(() => ({}));
  const parsed = createDocumentSchema.safeParse(body);
  if (!parsed.success) return badRequest("Invalid document");

  const document = await prisma.document.create({
    data: {
      title: parsed.data.title ?? DEFAULT_DOCUMENT_TITLE,
      contentHtml: "",
      ownerId: user.id,
    },
    select: { id: true, title: true, updatedAt: true },
  });

  return NextResponse.json({ document }, { status: 201 });
}
