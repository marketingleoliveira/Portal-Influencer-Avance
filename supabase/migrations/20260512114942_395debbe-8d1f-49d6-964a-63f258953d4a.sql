
-- Roles enum
create type public.app_role as enum ('admin', 'influencer');

-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  instagram_handle text,
  created_at timestamptz not null default now()
);
alter table public.profiles enable row level security;

-- Roles table
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique(user_id, role)
);
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

-- Submissions
create table public.submissions (
  id uuid primary key default gen_random_uuid(),
  influencer_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  description text,
  status text not null default 'pendente',
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.submissions enable row level security;

-- Files
create table public.submission_files (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  file_path text not null,
  file_type text not null, -- 'etiqueta' | 'foto' | 'video'
  mime_type text,
  created_at timestamptz not null default now()
);
alter table public.submission_files enable row level security;

-- RLS profiles
create policy "users view own profile" on public.profiles for select
  using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "users update own profile" on public.profiles for update
  using (auth.uid() = id);
create policy "admin insert profiles" on public.profiles for insert
  with check (public.has_role(auth.uid(), 'admin') or auth.uid() = id);

-- RLS user_roles
create policy "view own roles" on public.user_roles for select
  using (auth.uid() = user_id or public.has_role(auth.uid(), 'admin'));
create policy "admin manage roles" on public.user_roles for all
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- RLS submissions
create policy "influencer view own submissions" on public.submissions for select
  using (auth.uid() = influencer_id or public.has_role(auth.uid(), 'admin'));
create policy "influencer insert own submissions" on public.submissions for insert
  with check (auth.uid() = influencer_id);
create policy "influencer update own submissions" on public.submissions for update
  using (auth.uid() = influencer_id or public.has_role(auth.uid(), 'admin'));
create policy "admin/influencer delete own" on public.submissions for delete
  using (auth.uid() = influencer_id or public.has_role(auth.uid(), 'admin'));

-- RLS submission_files
create policy "view files of own submissions" on public.submission_files for select
  using (
    exists(select 1 from public.submissions s where s.id = submission_id and (s.influencer_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  );
create policy "insert files in own submissions" on public.submission_files for insert
  with check (
    exists(select 1 from public.submissions s where s.id = submission_id and s.influencer_id = auth.uid())
  );
create policy "delete own files" on public.submission_files for delete
  using (
    exists(select 1 from public.submissions s where s.id = submission_id and (s.influencer_id = auth.uid() or public.has_role(auth.uid(), 'admin')))
  );

-- Trigger: auto-create profile + influencer role on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, instagram_handle)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'instagram_handle');

  insert into public.user_roles (user_id, role)
  values (new.id, 'influencer');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- updated_at trigger
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

create trigger submissions_updated_at
before update on public.submissions
for each row execute function public.set_updated_at();

-- Storage bucket
insert into storage.buckets (id, name, public) values ('influencer-uploads', 'influencer-uploads', false);

create policy "users upload own folder" on storage.objects for insert
  with check (bucket_id = 'influencer-uploads' and auth.uid()::text = (storage.foldername(name))[1]);
create policy "users view own files" on storage.objects for select
  using (bucket_id = 'influencer-uploads' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin')));
create policy "users delete own files" on storage.objects for delete
  using (bucket_id = 'influencer-uploads' and (auth.uid()::text = (storage.foldername(name))[1] or public.has_role(auth.uid(), 'admin')));
