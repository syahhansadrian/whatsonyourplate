create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.items (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete cascade,
  parent_id uuid references public.items(id) on delete cascade,
  name text not null,
  description text,
  image_url text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists items_category_idx on public.items(category_id);
create index if not exists items_parent_idx on public.items(parent_id);

create table if not exists public.settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.settings enable row level security;

create policy "publik baca pengaturan"
  on public.settings for select
  using (true);

create policy "admin ubah pengaturan"
  on public.settings for all
  to authenticated
  using (true)
  with check (true);

alter table public.categories enable row level security;
alter table public.items enable row level security;
create policy "publik baca kategori"
  on public.categories for select
  using (true);

create policy "admin kelola kategori"
  on public.categories for all
  to authenticated
  using (true)
  with check (true);

create policy "publik baca item"
  on public.items for select
  using (true);

create policy "admin kelola item"
  on public.items for all
  to authenticated
  using (true)
  with check (true);

insert into storage.buckets (id, name, public)
values ('food-images', 'food-images', true)
on conflict (id) do nothing;

create policy "publik lihat gambar"
  on storage.objects for select
  using (bucket_id = 'food-images');

create policy "admin unggah gambar"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'food-images');

create policy "admin hapus gambar"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'food-images');

insert into public.categories (id, name, description, sort_order) values
  ('11111111-1111-4111-8111-111111111111', 'Main Theme', 'Inti makanan kalian malam ini. Pilih dulu ini.', 1),
  ('22222222-2222-4222-8222-222222222222', 'Dessert', 'Manis-manis penutupnya.', 2),
  ('33333333-3333-4333-8333-333333333333', 'Snack', 'Camilan kalau masih ada ruang.', 3)
on conflict (id) do nothing;

insert into public.items (id, category_id, parent_id, name, description, image_url, sort_order) values
  ('a0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', null, 'Mie', 'Kalau pengen yang hangat dan bikin kenyang.', null, 1),
  ('a0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', null, 'Ayam', 'Selalu aman. Tinggal pilih bumbunya.', null, 2),
  ('b0000000-0000-4000-8000-000000000001', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'Mie Goreng Jawa', 'Manis, gurih, porsinya puas.', null, 1),
  ('b0000000-0000-4000-8000-000000000002', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000001', 'Mie Rebus Kuah', 'Hangat berkuah, cocok kalau hujan.', null, 2),
  ('b0000000-0000-4000-8000-000000000003', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'Ayam Bumbu Hitam', 'Manis gurih, warna gelap, bikin nagih.', null, 1),
  ('b0000000-0000-4000-8000-000000000004', '11111111-1111-4111-8111-111111111111', 'a0000000-0000-4000-8000-000000000002', 'Ayam Bakar Madu', 'Manis, aroma bakarnya nagih.', null, 2),
  ('c0000000-0000-4000-8000-000000000001', '22222222-2222-4222-8222-222222222222', null, 'Es Krim', 'Dingin, lembut, klasik.', null, 1),
  ('c0000000-0000-4000-8000-000000000002', '22222222-2222-4222-8222-222222222222', null, 'Puding Cokelat', 'Lembut dan manisnya pas.', null, 2),
  ('c0000000-0000-4000-8000-000000000003', '22222222-2222-4222-8222-222222222222', null, 'Kue Cubit', 'Manis, bisa dimakan berdua.', null, 3),
  ('d0000000-0000-4000-8000-000000000001', '33333333-3333-4333-8333-333333333333', null, 'Gorengan', 'Tahu, tempe, bakwan. Murah meriah.', null, 1),
  ('d0000000-0000-4000-8000-000000000002', '33333333-3333-4333-8333-333333333333', null, 'Kentang Goreng', 'Renyah, selalu jadi aman.', null, 2),
  ('d0000000-0000-4000-8000-000000000003', '33333333-3333-4333-8333-333333333333', null, 'Popcorn', 'Buat nonton berdua.', null, 3)
on conflict (id) do nothing;
