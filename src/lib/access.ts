export type OwnedDocument = { id: string; ownerId: string };

export type DocumentShareRef = { documentId: string; userId: string };

export function canManage(userId: string, document: OwnedDocument): boolean {
  return document.ownerId === userId;
}

export function canAccess(
  userId: string,
  document: OwnedDocument,
  shares: readonly DocumentShareRef[],
): boolean {
  if (canManage(userId, document)) return true;
  return shares.some(
    (share) => share.documentId === document.id && share.userId === userId,
  );
}
