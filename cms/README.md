# Hommes Estates CMS

This CMS is embedded inside the Next.js app at /admin and stores content in Supabase (PostgreSQL + Storage + Auth).

## Stack

- Next.js App Router
- React + TailwindCSS + Framer Motion
- Supabase (DB, Auth, Storage)

## Setup

1. Create a Supabase project.
2. Create a Storage bucket named `media` with authenticated uploads allowed.
3. Add environment variables in .env:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

4. Install dependencies:

```
npm i @supabase/supabase-js
```

5. Database schema (run in Supabase SQL editor):

```
create table if not exists pages (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text,
  status text default 'published',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists content_blocks (
  id uuid primary key default gen_random_uuid(),
  page_slug text not null,
  section text not null,
  block_id text not null,
  content_type text not null,
  content_value jsonb not null,
  status text default 'draft',
  position int default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists media_assets (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  title text,
  alt text,
  width int,
  height int,
  created_by uuid,
  created_at timestamptz default now()
);

create table if not exists navigation_links (
  id uuid primary key default gen_random_uuid(),
  location text not null,
  label text not null,
  href text not null,
  position int default 0,
  visible boolean default true
);

create table if not exists testimonials (
  id uuid primary key default gen_random_uuid(),
  name text,
  quote text,
  role text,
  project text,
  rating int,
  image text,
  status text default 'published',
  position int default 0
);

create table if not exists partners (
  id uuid primary key default gen_random_uuid(),
  name text,
  logo text,
  url text,
  position int default 0,
  visible boolean default true
);

create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null
);
```

6. Roles

- Admin, Editor, Designer
- Use Supabase Auth; assign roles via a `profiles` table or Supabase Auth metadata.

7. Run

- Visit /admin to access the dashboard.
- Use the Pages module to edit sections and blocks.
