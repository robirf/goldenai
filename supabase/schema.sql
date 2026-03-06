-- Execute in Supabase SQL Editor (or MCP Supabase SQL runner)

create extension if not exists pgcrypto;

create table if not exists public.services (
  id bigint generated always as identity primary key,
  name text not null,
  category text not null,
  price numeric(10,2) not null check (price >= 0),
  duration integer not null check (duration > 0),
  status text not null default 'active' check (status in ('active', 'inactive')),
  image text,
  description text,
  professional_id bigint,
  created_at timestamptz not null default now()
);

create table if not exists public.professionals (
  id bigint generated always as identity primary key,
  name text not null,
  specialty text not null,
  email text not null unique,
  password text not null,
  role text not null default 'professional' check (role in ('admin', 'professional')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  image text,
  created_at timestamptz not null default now()
);

create table if not exists public.clients (
  id bigint generated always as identity primary key,
  name text not null,
  email text unique,
  whatsapp text not null unique,
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id bigint generated always as identity primary key,
  client_id bigint not null references public.clients(id) on delete cascade,
  service_id bigint not null references public.services(id) on delete restrict,
  professional_id bigint not null references public.professionals(id) on delete restrict,
  date text not null,
  time text not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'pending', 'cancelled')),
  created_at timestamptz not null default now()
);

alter table public.services add column if not exists description text;
alter table public.services add column if not exists professional_id bigint;
do $$
begin
  if not exists (
    select 1
    from information_schema.table_constraints
    where constraint_name = 'services_professional_id_fkey'
      and table_schema = 'public'
      and table_name = 'services'
  ) then
    alter table public.services
      add constraint services_professional_id_fkey
      foreign key (professional_id) references public.professionals(id) on delete set null;
  end if;
end $$;

create index if not exists idx_bookings_professional_id on public.bookings(professional_id);
create index if not exists idx_bookings_client_id on public.bookings(client_id);
create index if not exists idx_bookings_created_at on public.bookings(created_at);
create index if not exists idx_clients_whatsapp on public.clients(whatsapp);

insert into public.services (name, category, price, duration, image)
values
  ('Cílios', 'Estética', 150, 60, 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80'),
  ('Unhas', 'Manicure', 80, 45, 'https://images.unsplash.com/photo-1604654894610-df63bc536371?auto=format&fit=crop&w=1200&q=80'),
  ('Bronzeamento a Jato', 'Estética', 200, 90, 'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=1200&q=80')
on conflict do nothing;

insert into public.professionals (name, specialty, email, password, role, image)
values
  (
    'Admin Golden',
    'Administrador',
    'admin@goldenclinic.com',
    crypt('admin123', gen_salt('bf')),
    'admin',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'Ricardo Oliveira',
    'Especialista em Corte & Barba',
    'ricardo@goldenclinic.com',
    crypt('ricardo123', gen_salt('bf')),
    'professional',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=1200&q=80'
  ),
  (
    'Dra. Elena Rose',
    'Aesthetics Lead',
    'elena@goldenclinic.com',
    crypt('elena123', gen_salt('bf')),
    'professional',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=1200&q=80'
  )
on conflict (email) do nothing;

insert into storage.buckets (id, name, public)
values ('uploads', 'uploads', true)
on conflict (id) do nothing;
