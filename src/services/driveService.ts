import { FileKind } from '@/types';
import { STORAGE_KEYS, storage, mockNetworkDelay } from './storage';

/**
 * Fully mocked Google Drive browser. Real integration would:
 * 1. Authenticate via OAuth (e.g. `expo-auth-session` against Google's OAuth
 *    endpoint, or a Supabase Edge Function brokering the token exchange).
 * 2. Call the Drive API's `files.list` (filtered by `'<folderId>' in parents`)
 *    to browse real folders/files instead of `MOCK_FOLDERS`/`MOCK_FILES`.
 * 3. On import, download the file (`files.get` with `alt=media`, or
 *    `files.export` for native Google Docs formats) and hand the bytes to
 *    `fileService.addFile`/Supabase Storage instead of just copying the name.
 */

export interface MockDriveFolder {
  id: string;
  name: string;
  parentId: string | null;
}

export interface MockDriveFile {
  id: string;
  name: string;
  kind: FileKind;
  parentId: string;
}

export const DRIVE_ROOT_ID = 'root';

const MOCK_FOLDERS: MockDriveFolder[] = [
  { id: 'root', name: 'Mi unidad', parentId: null },
  { id: 'facultad', name: 'Facultad', parentId: 'root' },
  { id: 'apuntes-2025', name: 'Apuntes 2025', parentId: 'facultad' },
];

const MOCK_FILES: MockDriveFile[] = [
  { id: 'drive-file-1', name: 'Cronograma.pdf', kind: 'pdf', parentId: 'root' },
  { id: 'drive-file-2', name: 'Resumen Redes.pdf', kind: 'pdf', parentId: 'facultad' },
  { id: 'drive-file-3', name: 'Guía TP2.docx', kind: 'word', parentId: 'facultad' },
  { id: 'drive-file-4', name: 'Fotos pizarrón.jpg', kind: 'image', parentId: 'apuntes-2025' },
  { id: 'drive-file-5', name: 'Bibliografía.docx', kind: 'word', parentId: 'apuntes-2025' },
];

export const driveService = {
  async isConnected(): Promise<boolean> {
    return (await storage.get<boolean>(STORAGE_KEYS.driveConnected)) ?? false;
  },

  async connect(): Promise<void> {
    await mockNetworkDelay();
    await storage.set(STORAGE_KEYS.driveConnected, true);
  },

  async disconnect(): Promise<void> {
    await storage.set(STORAGE_KEYS.driveConnected, false);
  },

  getFolder(id: string): MockDriveFolder | undefined {
    return MOCK_FOLDERS.find((folder) => folder.id === id);
  },

  /** Resolves a file regardless of which folder is currently open — used when importing a multi-folder selection. */
  getFile(id: string): MockDriveFile | undefined {
    return MOCK_FILES.find((file) => file.id === id);
  },

  listChildren(parentId: string): { folders: MockDriveFolder[]; files: MockDriveFile[] } {
    return {
      folders: MOCK_FOLDERS.filter((folder) => folder.parentId === parentId),
      files: MOCK_FILES.filter((file) => file.parentId === parentId),
    };
  },
};
