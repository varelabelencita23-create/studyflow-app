import { supabase } from '@/lib/supabase';
import { Subject } from '@/types';

interface SubjectInput {
  name: string;
  shortName?: string;
  professor?: string;
}

interface SubjectRow {
  id: string;
  user_id: string;
  name: string;
  short_name: string;
  professor: string | null;
  progress: number;
  order_index: number;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

function mapSubject(row: SubjectRow): Subject {
  return {
    id: row.id,
    userId: row.user_id,
    name: row.name,
    shortName: row.short_name,
    professor: row.professor ?? undefined,
    progress: row.progress,
    order: row.order_index,
    archived: row.archived,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function deriveShortName(name: string): string {
  return name.trim().slice(0, 12).toUpperCase();
}

async function readAll(): Promise<Subject[]> {
  const { data, error } = await supabase.from('subjects').select('*').order('order_index', { ascending: true });
  if (error) throw error;
  return (data as SubjectRow[]).map(mapSubject);
}

export const subjectsService = {
  async list(): Promise<Subject[]> {
    return readAll();
  },

  async add(input: SubjectInput, userId: string): Promise<Subject> {
    const existing = await readAll();
    const { data, error } = await supabase
      .from('subjects')
      .insert({
        user_id: userId,
        name: input.name.trim(),
        short_name: (input.shortName?.trim() || deriveShortName(input.name)) as string,
        professor: input.professor?.trim() || null,
        progress: 0,
        order_index: existing.length,
        archived: false,
      })
      .select('*')
      .single();
    if (error) throw error;
    return mapSubject(data as SubjectRow);
  },

  async update(id: string, patch: Partial<SubjectInput>): Promise<Subject[]> {
    const dbPatch: Record<string, unknown> = {};
    if (patch.name !== undefined) dbPatch.name = patch.name.trim();
    if (patch.shortName !== undefined && patch.shortName.trim()) dbPatch.short_name = patch.shortName.trim();
    if (patch.professor !== undefined) dbPatch.professor = patch.professor?.trim() || null;

    const { error } = await supabase.from('subjects').update(dbPatch).eq('id', id);
    if (error) throw error;
    return readAll();
  },

  async remove(id: string): Promise<Subject[]> {
    const { error } = await supabase.from('subjects').delete().eq('id', id);
    if (error) throw error;

    const remaining = await readAll();
    await Promise.all(
      remaining.map((subject, index) =>
        subject.order === index ? null : supabase.from('subjects').update({ order_index: index }).eq('id', subject.id),
      ),
    );
    return readAll();
  },

  async setProgress(id: string, progress: number): Promise<Subject[]> {
    const { error } = await supabase.from('subjects').update({ progress }).eq('id', id);
    if (error) throw error;
    return readAll();
  },

  async reorder(orderedIds: string[]): Promise<Subject[]> {
    await Promise.all(
      orderedIds.map((id, index) => supabase.from('subjects').update({ order_index: index }).eq('id', id)),
    );
    return readAll();
  },
};
