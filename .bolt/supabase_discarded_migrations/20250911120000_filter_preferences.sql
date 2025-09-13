-- Create table for user filter preferences
create table if not exists public.filter_preferences (
  user_id uuid primary key references auth.users on delete cascade,
  filters jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.filter_preferences enable row level security;

-- Policies
create policy "select_own_filters" on public.filter_preferences for select using ( auth.uid() = user_id );
create policy "insert_own_filters" on public.filter_preferences for insert with check ( auth.uid() = user_id );
create policy "update_own_filters" on public.filter_preferences for update using ( auth.uid() = user_id );

create index if not exists idx_filter_prefs_updated_at on public.filter_preferences (updated_at desc);
