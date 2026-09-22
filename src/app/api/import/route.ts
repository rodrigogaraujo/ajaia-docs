import { NextResponse } from "next/server";
import { apiError, badRequest, requireApiUser } from "@/lib/api";
import { CONTENT_MAX_BYTES } from "@/lib/documents";
import {
  ACCEPTED_EXTENSIONS,
  ConversionFailed,
  IMPORT_MAX_BYTES,
  UnsupportedFileType,
  extensionOf,
  fileToHtml,
  isAcceptedExtension,
  titleFromFileName,
} from "@/lib/import";
import { prisma } from "@/lib/prisma";
import { sanitizeDocumentHtml } from "@/lib/sanitize";

const tooLarge = (message: string) => apiError(message, 413);
const unprocessable = (message: string) => apiError(message, 422);

export async function POST(request: Request) {
  const { user, response } = await requireApiUser();
  if (!user) return response;

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return badRequest("Choose a file to import");

  const extension = extensionOf(file.name);
  if (!isAcceptedExtension(extension)) {
    return badRequest(
      `Unsupported file type. Accepted: ${ACCEPTED_EXTENSIONS.join(", ")}`,
    );
  }
  if (file.size === 0) return badRequest("That file is empty");
  if (file.size > IMPORT_MAX_BYTES) {
    return tooLarge("That file is larger than 2MB");
  }

  let html: string;
  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    html = await fileToHtml(file.name, buffer);
  } catch (error) {
    if (error instanceof UnsupportedFileType) {
      return badRequest(error.message);
    }
    if (error instanceof ConversionFailed) {
      return unprocessable("Could not read that file. It may be corrupt.");
    }
    throw error;
  }

  const contentHtml = sanitizeDocumentHtml(html);
  if (Buffer.byteLength(contentHtml, "utf8") > CONTENT_MAX_BYTES) {
    return tooLarge("That file produces more content than a document can hold");
  }

  const document = await prisma.document.create({
    data: {
      title: titleFromFileName(file.name),
      contentHtml,
      ownerId: user.id,
    },
    select: { id: true, title: true },
  });

  return NextResponse.json({ document }, { status: 201 });
}
