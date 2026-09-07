import { FileKind } from '@/types';

/** Best-effort mapping from a picked file's mime type (or its extension) to our fixed `FileKind` set. */
export function inferFileKind(mimeType: string | null | undefined, name: string): FileKind {
  const type = mimeType?.toLowerCase() ?? '';
  const extension = name.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1] ?? '';

  if (type === 'application/pdf' || extension === 'pdf') return 'pdf';
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'heic', 'webp', 'gif'].includes(extension)) return 'image';
  if (
    type.includes('word') ||
    type.includes('msword') ||
    ['doc', 'docx'].includes(extension)
  ) {
    return 'word';
  }
  if (
    type === 'text/plain' ||
    type.includes('presentation') ||
    type.includes('spreadsheet') ||
    ['txt', 'ppt', 'pptx', 'xls', 'xlsx'].includes(extension)
  ) {
    return 'document';
  }
  return 'other';
}
