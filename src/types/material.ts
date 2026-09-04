import { ID, ISODateString, Timestamped } from './common';

export type FileKind = 'pdf' | 'word' | 'image' | 'document' | 'other';

export type FolderCategory = 'apuntes' | 'clases' | 'trabajos-practicos' | 'parciales' | 'material-extra';

export type FileSource = 'device' | 'camera' | 'gallery' | 'google-drive';

export interface Folder extends Timestamped {
  id: ID;
  subjectId: ID;
  name: string;
  category: FolderCategory;
  fileCount: number;
}

export interface StudyMaterial extends Timestamped {
  id: ID;
  folderId: ID;
  subjectId: ID;
  name: string;
  kind: FileKind;
  source: FileSource;
  sizeBytes?: number;
  /** Local URI, remote Supabase Storage URL, or Drive file id — resolved by the file service. */
  uri?: string;
  thumbnailUri?: string;
}
