-- StudyFlow — Row Level Security
-- Every table is private-per-user. The policy is always the same shape:
-- a row is yours to read/write only when its `user_id` (or `id` for
-- `profiles`) equals `auth.uid()`. This is enforced by Postgres itself, not
-- by anything the client sends — a malicious or buggy client cannot see or
-- touch another user's rows no matter what it queries for.

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);
-- No insert/delete policy: rows are created by the handle_new_user trigger
-- (security definer) on signup and removed via the auth.users cascade on
-- account deletion — never directly by the client.

-- ---------------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------------
alter table public.subjects enable row level security;

create policy "subjects_select_own" on public.subjects
  for select using (auth.uid() = user_id);
create policy "subjects_insert_own" on public.subjects
  for insert with check (auth.uid() = user_id);
create policy "subjects_update_own" on public.subjects
  for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subjects_delete_own" on public.subjects
  for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- units / topics / subtopics
-- ---------------------------------------------------------------------------
alter table public.units enable row level security;
create policy "units_select_own" on public.units for select using (auth.uid() = user_id);
create policy "units_insert_own" on public.units for insert with check (auth.uid() = user_id);
create policy "units_update_own" on public.units for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "units_delete_own" on public.units for delete using (auth.uid() = user_id);

alter table public.topics enable row level security;
create policy "topics_select_own" on public.topics for select using (auth.uid() = user_id);
create policy "topics_insert_own" on public.topics for insert with check (auth.uid() = user_id);
create policy "topics_update_own" on public.topics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "topics_delete_own" on public.topics for delete using (auth.uid() = user_id);

alter table public.subtopics enable row level security;
create policy "subtopics_select_own" on public.subtopics for select using (auth.uid() = user_id);
create policy "subtopics_insert_own" on public.subtopics for insert with check (auth.uid() = user_id);
create policy "subtopics_update_own" on public.subtopics for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "subtopics_delete_own" on public.subtopics for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- study sessions
-- ---------------------------------------------------------------------------
alter table public.study_sessions enable row level security;
create policy "study_sessions_select_own" on public.study_sessions for select using (auth.uid() = user_id);
create policy "study_sessions_insert_own" on public.study_sessions for insert with check (auth.uid() = user_id);
create policy "study_sessions_update_own" on public.study_sessions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "study_sessions_delete_own" on public.study_sessions for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- weekly planner
-- ---------------------------------------------------------------------------
alter table public.weekly_plans enable row level security;
create policy "weekly_plans_select_own" on public.weekly_plans for select using (auth.uid() = user_id);
create policy "weekly_plans_insert_own" on public.weekly_plans for insert with check (auth.uid() = user_id);
create policy "weekly_plans_update_own" on public.weekly_plans for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_plans_delete_own" on public.weekly_plans for delete using (auth.uid() = user_id);

alter table public.weekly_plan_items enable row level security;
create policy "weekly_plan_items_select_own" on public.weekly_plan_items for select using (auth.uid() = user_id);
create policy "weekly_plan_items_insert_own" on public.weekly_plan_items for insert with check (auth.uid() = user_id);
create policy "weekly_plan_items_update_own" on public.weekly_plan_items for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "weekly_plan_items_delete_own" on public.weekly_plan_items for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- content plan assignments
-- ---------------------------------------------------------------------------
alter table public.content_plan_assignments enable row level security;
create policy "content_plan_assignments_select_own" on public.content_plan_assignments for select using (auth.uid() = user_id);
create policy "content_plan_assignments_insert_own" on public.content_plan_assignments for insert with check (auth.uid() = user_id);
create policy "content_plan_assignments_update_own" on public.content_plan_assignments for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "content_plan_assignments_delete_own" on public.content_plan_assignments for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- study materials (files)
-- ---------------------------------------------------------------------------
alter table public.study_materials enable row level security;
create policy "study_materials_select_own" on public.study_materials for select using (auth.uid() = user_id);
create policy "study_materials_insert_own" on public.study_materials for insert with check (auth.uid() = user_id);
create policy "study_materials_update_own" on public.study_materials for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "study_materials_delete_own" on public.study_materials for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- exams / exam_topics
-- ---------------------------------------------------------------------------
alter table public.exams enable row level security;
create policy "exams_select_own" on public.exams for select using (auth.uid() = user_id);
create policy "exams_insert_own" on public.exams for insert with check (auth.uid() = user_id);
create policy "exams_update_own" on public.exams for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "exams_delete_own" on public.exams for delete using (auth.uid() = user_id);

alter table public.exam_topics enable row level security;
create policy "exam_topics_select_own" on public.exam_topics for select using (auth.uid() = user_id);
create policy "exam_topics_insert_own" on public.exam_topics for insert with check (auth.uid() = user_id);
create policy "exam_topics_delete_own" on public.exam_topics for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- flashcards
-- ---------------------------------------------------------------------------
alter table public.flashcard_decks enable row level security;
create policy "flashcard_decks_select_own" on public.flashcard_decks for select using (auth.uid() = user_id);
create policy "flashcard_decks_insert_own" on public.flashcard_decks for insert with check (auth.uid() = user_id);
create policy "flashcard_decks_update_own" on public.flashcard_decks for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "flashcard_decks_delete_own" on public.flashcard_decks for delete using (auth.uid() = user_id);

alter table public.flashcards enable row level security;
create policy "flashcards_select_own" on public.flashcards for select using (auth.uid() = user_id);
create policy "flashcards_insert_own" on public.flashcards for insert with check (auth.uid() = user_id);
create policy "flashcards_update_own" on public.flashcards for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "flashcards_delete_own" on public.flashcards for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- quizzes
-- ---------------------------------------------------------------------------
alter table public.quizzes enable row level security;
create policy "quizzes_select_own" on public.quizzes for select using (auth.uid() = user_id);
create policy "quizzes_insert_own" on public.quizzes for insert with check (auth.uid() = user_id);
create policy "quizzes_update_own" on public.quizzes for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quizzes_delete_own" on public.quizzes for delete using (auth.uid() = user_id);

alter table public.quiz_questions enable row level security;
create policy "quiz_questions_select_own" on public.quiz_questions for select using (auth.uid() = user_id);
create policy "quiz_questions_insert_own" on public.quiz_questions for insert with check (auth.uid() = user_id);
create policy "quiz_questions_update_own" on public.quiz_questions for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "quiz_questions_delete_own" on public.quiz_questions for delete using (auth.uid() = user_id);

alter table public.quiz_attempts enable row level security;
create policy "quiz_attempts_select_own" on public.quiz_attempts for select using (auth.uid() = user_id);
create policy "quiz_attempts_insert_own" on public.quiz_attempts for insert with check (auth.uid() = user_id);
create policy "quiz_attempts_delete_own" on public.quiz_attempts for delete using (auth.uid() = user_id);
-- No update policy: an attempt is an immutable record of what happened.

-- ---------------------------------------------------------------------------
-- notification preferences
-- ---------------------------------------------------------------------------
alter table public.notification_preferences enable row level security;
create policy "notification_preferences_select_own" on public.notification_preferences for select using (auth.uid() = user_id);
create policy "notification_preferences_insert_own" on public.notification_preferences for insert with check (auth.uid() = user_id);
create policy "notification_preferences_update_own" on public.notification_preferences for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- achievements
-- ---------------------------------------------------------------------------
alter table public.user_achievements enable row level security;
create policy "user_achievements_select_own" on public.user_achievements for select using (auth.uid() = user_id);
create policy "user_achievements_insert_own" on public.user_achievements for insert with check (auth.uid() = user_id);
-- No update/delete: once unlocked, an achievement stays unlocked forever.
