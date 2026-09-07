-- StudyFlow — Storage bucket + policies
-- Files live at `<user_id>/<subject_id>/<folder_category>/<filename>` inside
-- one private bucket. `study_materials.storage_path` stores that path; the
-- app reads/writes bytes through the Storage API using the signed-in user's
-- own session, never a public URL, since the bucket is not public.

insert into storage.buckets (id, name, public)
values ('study-materials', 'study-materials', false)
on conflict (id) do nothing;

-- The first path segment must be the caller's own user id — this is what
-- actually keeps one user's files invisible/unwritable to another, not
-- anything the app decides to send.
create policy "study_materials_storage_select_own"
  on storage.objects for select
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "study_materials_storage_insert_own"
  on storage.objects for insert
  with check (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "study_materials_storage_update_own"
  on storage.objects for update
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  )
  with check (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "study_materials_storage_delete_own"
  on storage.objects for delete
  using (
    bucket_id = 'study-materials'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
