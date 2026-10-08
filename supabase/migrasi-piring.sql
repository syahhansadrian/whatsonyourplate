-- Jalankan sekali di SQL Editor Supabase (setelah schema.sql).
-- Menambah tabel settings untuk foto piring & pengaturan show.

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'settings' and policyname = 'publik baca pengaturan'
  ) then
    create policy "publik baca pengaturan"
      on public.settings for select
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'settings' and policyname = 'admin ubah pengaturan'
  ) then
    create policy "admin ubah pengaturan"
      on public.settings for all
      to authenticated
      using (true)
      with check (true);
  end if;
end $$;

insert into public.settings (key, value) values ('plate_image_url', '')
  on conflict (key) do nothing;
