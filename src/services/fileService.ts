import { FileKind, FileSource, Folder, FolderCategory, ID, StudyMaterial } from '@/types';
import { generateId } from '@/utils';
import { STORAGE_KEYS, storage } from './storage';

/**
 * Folders are a fixed set of 5 categories per subject (Finder-style), so
 * they're computed on the fly from a deterministic id rather than stored as
 * their own records — there's nothing for the user to create/rename/delete
 * at the folder level, only the files inside them.
 */
const FOLDER_DEFS: { category: FolderCategory; name: string }[] = [
  { category: 'apuntes', name: 'Apuntes' },
  { category: 'clases', name: 'Clases' },
  { category: 'trabajos-practicos', name: 'Trabajos prácticos' },
  { category: 'parciales', name: 'Parciales' },
  { category: 'material-extra', name: 'Material extra' },
];

function folderId(subjectId: ID, category: FolderCategory): ID {
  return `folder_${subjectId}_${category}`;
}

async function readAll(): Promise<StudyMaterial[]> {
  return (await storage.get<StudyMaterial[]>(STORAGE_KEYS.studyMaterials)) ?? [];
}
async function writeAll(materials: StudyMaterial[]): Promise<void> {
  await storage.set(STORAGE_KEYS.studyMaterials, materials);
}

async function listFolders(subjectId: ID): Promise<Folder[]> {
  const materials = await readAll();
  const now = new Date().toISOString();
  return FOLDER_DEFS.map((def) => {
    const id = folderId(subjectId, def.category);
    return {
      id,
      subjectId,
      name: def.name,
      category: def.category,
      fileCount: materials.filter((material) => material.folderId === id).length,
      createdAt: now,
      updatedAt: now,
    };
  });
}

async function listFiles(subjectId: ID, category: FolderCategory): Promise<StudyMaterial[]> {
  const id = folderId(subjectId, category);
  return (await readAll()).filter((material) => material.folderId === id);
}

async function getById(id: ID): Promise<StudyMaterial | null> {
  const materials = await readAll();
  return materials.find((material) => material.id === id) ?? null;
}

interface AddFileInput {
  name: string;
  kind: FileKind;
  source: FileSource;
}

/**
 * Creates a mock file record. Real integration points for later:
 * - 'device' / 'gallery' -> expo-document-picker / expo-image-picker to get a real local uri.
 * - 'camera' -> expo-image-picker's camera launcher (or expo-camera).
 * - 'google-drive' -> handled by driveService's import flow (already wired from the Archivos screen).
 * - Persisting the actual bytes -> Supabase Storage, storing the resulting URL in `uri`.
 */
async function addFile(subjectId: ID, category: FolderCategory, input: AddFileInput): Promise<StudyMaterial> {
  const materials = await readAll();
  const now = new Date().toISOString();
  const material: StudyMaterial = {
    id: generateId('file'),
    folderId: folderId(subjectId, category),
    subjectId,
    name: input.name,
    kind: input.kind,
    source: input.source,
    createdAt: now,
    updatedAt: now,
  };
  await writeAll([...materials, material]);
  return material;
}

async function renameFile(id: ID, name: string): Promise<StudyMaterial[]> {
  const materials = await readAll();
  const target = materials.find((material) => material.id === id);
  const next = materials.map((material) =>
    material.id === id ? { ...material, name: name.trim(), updatedAt: new Date().toISOString() } : material,
  );
  await writeAll(next);
  return target ? next.filter((material) => material.folderId === target.folderId) : next;
}

async function removeFile(id: ID): Promise<StudyMaterial[]> {
  const materials = await readAll();
  const target = materials.find((material) => material.id === id);
  const next = materials.filter((material) => material.id !== id);
  await writeAll(next);
  return target ? next.filter((material) => material.folderId === target.folderId) : next;
}

export const fileService = {
  FOLDER_DEFS,
  listFolders,
  listFiles,
  getById,
  addFile,
  renameFile,
  removeFile,
};
