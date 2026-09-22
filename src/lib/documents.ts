import { z } from "zod";

export const DEFAULT_DOCUMENT_TITLE = "Untitled document";

export const TITLE_MAX_LENGTH = 120;
export const CONTENT_MAX_BYTES = 500 * 1024;

const titleSchema = z.string().trim().min(1).max(TITLE_MAX_LENGTH);

const contentSchema = z
  .string()
  .refine(
    (value) => Buffer.byteLength(value, "utf8") <= CONTENT_MAX_BYTES,
    `Content exceeds ${CONTENT_MAX_BYTES} bytes`,
  );

export const createDocumentSchema = z.object({
  title: titleSchema.optional(),
});

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    contentHtml: contentSchema.optional(),
  })
  .refine(
    (value) => value.title !== undefined || value.contentHtml !== undefined,
    "Supply a title, contentHtml, or both",
  );

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;

export const documentListSelect = {
  id: true,
  title: true,
  updatedAt: true,
  owner: { select: { name: true } },
} as const;
