-- StudyFlow — initial schema
-- Mirrors src/types/*.ts exactly. Every table that holds user data carries a
-- denormalized `user_id` (even where it's reachable via a parent FK) so RLS
-- policies never need a join — this is the standard Supabase pattern and
-- keeps every policy a simple `auth.uid() = user_id` check.
--
-- Arrays that are recomputed from a child table on every read in the app
-- (Unit.topicIds, Topic.subtopicIds, FlashcardDeck.cardIds, Quiz.questionIds)
-- are intentionally NOT stored as columns here — they're derived by querying
-- the child table with `where parent_id = x`, exactly like the AsyncStorage
-- version already did. Storing them twice would just invite drift.

create extension if not exists pgcrypto;

-- Reusable trigger: keep `updated_at` current on every row update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null,
  avatar_url text,
  study_mode text not null default 'standard' check (study_mode in ('standard', 'deep', 'free')),
  max_subjects_per_week int not null default 3 check (max_subjects_per_week > 0),
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-create a profile row the moment someone signs up.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    new.email
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- subjects
-- ---------------------------------------------------------------------------
create table public.subjects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  short_name text not null,
  professor text,
  progress numeric not null default 0 check (progress >= 0 and progress <= 1),
  order_index int not null default 0,
  archived boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subjects_user_id_idx on public.subjects(user_id);
create trigger set_updated_at before update on public.subjects
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- content hierarchy: units -> topics -> subtopics
-- ---------------------------------------------------------------------------
create table public.units (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  status text not null default 'not-started' check (status in ('not-started', 'in-progress', 'completed')),
  progress numeric not null default 0 check (progress >= 0 and progress <= 1),
  minutes_studied int not null default 0,
  last_session_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  target_date date,
  important_for_exam boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index units_subject_id_idx on public.units(subject_id);
create index units_user_id_idx on public.units(user_id);
create trigger set_updated_at before update on public.units
  for each row execute function public.set_updated_at();

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  unit_id uuid not null references public.units(id) on delete cascade,
  title text not null,
  status text not null default 'not-started' check (status in ('not-started', 'in-progress', 'completed')),
  progress numeric not null default 0 check (progress >= 0 and progress <= 1),
  minutes_studied int not null default 0,
  last_session_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  target_date date,
  important_for_exam boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index topics_unit_id_idx on public.topics(unit_id);
create index topics_subject_id_idx on public.topics(subject_id);
create index topics_user_id_idx on public.topics(user_id);
create trigger set_updated_at before update on public.topics
  for each row execute function public.set_updated_at();

create table public.subtopics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  title text not null,
  status text not null default 'not-started' check (status in ('not-started', 'in-progress', 'completed')),
  progress numeric not null default 0 check (progress >= 0 and progress <= 1),
  minutes_studied int not null default 0,
  last_session_at timestamptz,
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high')),
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  target_date date,
  important_for_exam boolean not null default false,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index subtopics_topic_id_idx on public.subtopics(topic_id);
create index subtopics_subject_id_idx on public.subtopics(subject_id);
create index subtopics_user_id_idx on public.subtopics(user_id);
create trigger set_updated_at before update on public.subtopics
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- study sessions
-- ---------------------------------------------------------------------------
create table public.study_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  content_ids uuid[] not null default '{}',
  date timestamptz not null default now(),
  duration_seconds int not null default 0 check (duration_seconds >= 0),
  status text not null default 'in-progress' check (status in ('in-progress', 'paused', 'completed', 'discarded')),
  goal_minutes int,
  goal_met boolean,
  progress_before numeric not null default 0,
  progress_after numeric not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index study_sessions_user_id_idx on public.study_sessions(user_id);
create index study_sessions_subject_id_idx on public.study_sessions(subject_id);
create index study_sessions_date_idx on public.study_sessions(date);
create trigger set_updated_at before update on public.study_sessions
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- weekly planner
-- ---------------------------------------------------------------------------
create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  week_start_date date not null,
  selected_subject_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start_date)
);
create index weekly_plans_user_id_idx on public.weekly_plans(user_id);
create trigger set_updated_at before update on public.weekly_plans
  for each row execute function public.set_updated_at();

create table public.weekly_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  weekly_plan_id uuid not null references public.weekly_plans(id) on delete cascade,
  day text not null check (day in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  subject_id uuid not null references public.subjects(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (weekly_plan_id, day)
);
create index weekly_plan_items_plan_id_idx on public.weekly_plan_items(weekly_plan_id);
create index weekly_plan_items_user_id_idx on public.weekly_plan_items(user_id);

-- ---------------------------------------------------------------------------
-- per-subject content plan (assign pending content to a day of the week)
-- ---------------------------------------------------------------------------
create table public.content_plan_assignments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  content_id uuid not null,
  day text not null check (day in ('mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun')),
  created_at timestamptz not null default now(),
  unique (subject_id, content_id)
);
create index content_plan_assignments_subject_id_idx on public.content_plan_assignments(subject_id);
create index content_plan_assignments_user_id_idx on public.content_plan_assignments(user_id);

-- ---------------------------------------------------------------------------
-- files (Supabase Storage holds the bytes; this table holds the metadata)
-- ---------------------------------------------------------------------------
create table public.study_materials (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  folder_category text not null check (folder_category in ('apuntes', 'clases', 'trabajos-practicos', 'parciales', 'material-extra')),
  name text not null,
  kind text not null check (kind in ('pdf', 'word', 'image', 'document', 'other')),
  source text not null check (source in ('device', 'camera', 'gallery', 'google-drive')),
  size_bytes bigint,
  storage_path text,
  thumbnail_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index study_materials_subject_id_idx on public.study_materials(subject_id);
create index study_materials_user_id_idx on public.study_materials(user_id);
create index study_materials_folder_idx on public.study_materials(subject_id, folder_category);
create trigger set_updated_at before update on public.study_materials
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- exams
-- ---------------------------------------------------------------------------
create table public.exams (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  title text not null,
  type text not null check (type in ('parcial', 'recuperatorio', 'final', 'trabajo-practico')),
  date timestamptz not null,
  material_file_id uuid references public.study_materials(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exams_subject_id_idx on public.exams(subject_id);
create index exams_user_id_idx on public.exams(user_id);
create index exams_date_idx on public.exams(date);
create trigger set_updated_at before update on public.exams
  for each row execute function public.set_updated_at();

-- join table: which topics an exam is linked to (Exam.topicIds)
create table public.exam_topics (
  exam_id uuid not null references public.exams(id) on delete cascade,
  topic_id uuid not null references public.topics(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  primary key (exam_id, topic_id)
);
create index exam_topics_exam_id_idx on public.exam_topics(exam_id);

-- ---------------------------------------------------------------------------
-- flashcards
-- ---------------------------------------------------------------------------
create table public.flashcard_decks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  generated boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index flashcard_decks_subject_id_idx on public.flashcard_decks(subject_id);
create index flashcard_decks_user_id_idx on public.flashcard_decks(user_id);
create trigger set_updated_at before update on public.flashcard_decks
  for each row execute function public.set_updated_at();

create table public.flashcards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  deck_id uuid not null references public.flashcard_decks(id) on delete cascade,
  content_id uuid,
  question text not null,
  answer text not null,
  mastery text not null default 'new' check (mastery in ('new', 'learning', 'mastered')),
  times_reviewed int not null default 0,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index flashcards_deck_id_idx on public.flashcards(deck_id);
create index flashcards_user_id_idx on public.flashcards(user_id);
create trigger set_updated_at before update on public.flashcards
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quizzes / tests
-- ---------------------------------------------------------------------------
create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id uuid not null references public.subjects(id) on delete cascade,
  name text not null,
  difficulty text not null default 'medium' check (difficulty in ('easy', 'medium', 'hard')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index quizzes_subject_id_idx on public.quizzes(subject_id);
create index quizzes_user_id_idx on public.quizzes(user_id);
create trigger set_updated_at before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.quiz_questions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  content_id uuid,
  prompt text not null,
  options text[] not null,
  correct_option_index int not null,
  created_at timestamptz not null default now()
);
create index quiz_questions_quiz_id_idx on public.quiz_questions(quiz_id);
create index quiz_questions_user_id_idx on public.quiz_questions(user_id);

create table public.quiz_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  quiz_id uuid not null references public.quizzes(id) on delete cascade,
  date timestamptz not null default now(),
  correct_count int not null default 0,
  total_count int not null default 0,
  answer_index_by_question_id jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index quiz_attempts_quiz_id_idx on public.quiz_attempts(quiz_id);
create index quiz_attempts_user_id_idx on public.quiz_attempts(user_id);

-- ---------------------------------------------------------------------------
-- notification preferences (mock push notifications until expo-notifications
-- is wired up — this just persists the toggle state)
-- ---------------------------------------------------------------------------
create table public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  daily_reminder boolean not null default true,
  exam_reminders boolean not null default true,
  updated_at timestamptz not null default now()
);
create trigger set_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- achievements (5 fixed kinds; a row means "unlocked", once, forever)
-- ---------------------------------------------------------------------------
create table public.user_achievements (
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null check (kind in ('streak-7', 'streak-30', 'first-session', 'subject-completed', 'perfect-week')),
  unlocked_at timestamptz not null default now(),
  primary key (user_id, kind)
);
