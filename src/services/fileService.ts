import { getCurrentUserId, supabase } from '@/lib/supabase';
import { generateId } from '@/utils';
import { FileKind, FileSource, Folder, FolderCategory, ID, StudyMaterial } from '@/types';

const BUCKET = 'study-materials';

/**
 * Folders are a fixed set of 5 categories per subject (Finder-style), so
 * they're computed on the fly from the category rather than stored as their
 * own Postgres rows — there's nothing for the user to create/rename/delete
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

interface MaterialRow {
  id: string;
  subject_id: string;
  folder_category: FolderCategory;
  name: string;
  kind: FileKind;
  source: FileSource;
  size_bytes: number | null;
  storage_path: string | null;
  thumbnail_path: string | null;
  created_at: string;
  updated_at: string;
}

function mapMaterial(row: MaterialRow): StudyMaterial {
  return {
    id: row.id,
    folderId: folderId(row.subject_id, row.folder_category),
    subjectId: row.subject_id,
    name: row.name,
    kind: row.kind,
    source: row.source,
    sizeBytes: row.size_bytes ?? undefined,
    uri: row.storage_path ?? undefined,
    thumbnailUri: row.thumbnail_path ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function listFolders(subjectId: ID): Promise<Folder[]> {
  const { data, error } = await supabase.from('study_materials').select('folder_category').eq('subject_id', subjectId);
  if (error) throw error;
  const counts = new Map<FolderCategory, number>();
  for (const row of data as { folder_category: FolderCategory }[]) {
    counts.set(row.folder_category, (counts.get(row.folder_category) ?? 0) + 1);
  }
  const now = new Date().toISOString();
  return FOLDER_DEFS.map((def) => ({
    id: folderId(subjectId, def.category),
    subjectId,
    name: def.name,
    category: def.category,
    fileCount: counts.get(def.category) ?? 0,
    createdAt: now,
    updatedAt: now,
  }));
}

async function listFiles(subjectId: ID, category: FolderCategory): Promise<StudyMaterial[]> {
  const { data, error } = await supabase
    .from('study_materials')
    .select('*')
    .eq('subject_id', subjectId)
    .eq('folder_category', category)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as MaterialRow[]).map(mapMaterial);
}

async function getById(id: ID): Promise<StudyMaterial | null> {
  const { data, error } = await supabase.from('study_materials').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data ? mapMaterial(data as MaterialRow) : null;
}

interface UploadFileInput {
  /** Local file URI from expo-document-picker / expo-image-picker. */
  uri: string;
  name: string;
  mimeType?: string;
  kind: FileKind;
  source: FileSource;
}

/**
 * Uploads real bytes to Supabase Storage (private bucket, one folder per
 * user) and persists the metadata row pointing at that path. If the metadata
 * insert fails after a successful upload, the orphaned blob is removed so
 * Storage and Postgres never disagree about what files exist.
 */
async function uploadFile(subjectId: ID, category: FolderCategory, input: UploadFileInput): Promise<StudyMaterial> {
  const userId = await getCurrentUserId();
  const extensionMatch = input.name.match(/\.[a-zA-Z0-9]+$/);
  const storagePath = `${userId}/${subjectId}/${category}/${generateId('file')}${extensionMatch ? extensionMatch[0] : ''}`;

  const response = await fetch(input.uri);
  const bytes = await response.arrayBuffer();

  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, bytes, {
    contentType: input.mimeType || 'application/octet-stream',
    upsert: false,
  });
  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('study_materials')
    .insert({
      user_id: userId,
      subject_id: subjectId,
      folder_category: category,
      name: input.name,
      kind: input.kind,
      source: input.source,
      size_bytes: bytes.byteLength,
      storage_path: storagePath,
    })
    .select('*')
    .single();
  if (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    throw error;
  }
  return mapMaterial(data as MaterialRow);
}

/** A short-lived (10 min) signed URL to view/download a private file. */
async function getSignedUrl(material: StudyMaterial): Promise<string> {
  if (!material.uri) throw new Error('Este archivo no tiene contenido para abrir.');
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(material.uri, 60 * 10);
  if (error) throw error;
  return data.signedUrl;
}

async function renameFile(id: ID, name: string): Promise<StudyMaterial[]> {
  const { data: current, error: readError } = await supabase
    .from('study_materials')
    .select('subject_id, folder_category')
    .eq('id', id)
    .single();
  if (readError) throw readError;

  const { error } = await supabase.from('study_materials').update({ name: name.trim() }).eq('id', id);
  if (error) throw error;
  return listFiles(current.subject_id, current.folder_category);
}

async function removeFile(id: ID): Promise<StudyMaterial[]> {
  const { data: current, error: readError } = await supabase
    .from('study_materials')
    .select('subject_id, folder_category, storage_path')
    .eq('id', id)
    .single();
  if (readError) throw readError;

  if (current.storage_path) {
    const { error: storageError } = await supabase.storage.from(BUCKET).remove([current.storage_path]);
    if (storageError) throw storageError;
  }

  const { error } = await supabase.from('study_materials').delete().eq('id', id);
  if (error) throw error;
  return listFiles(current.subject_id, current.folder_category);
}

export const fileService = {
  FOLDER_DEFS,
  listFolders,
  listFiles,
  getById,
  uploadFile,
  getSignedUrl,
  renameFile,
  removeFile,
};
