create table if not exists info_posts (
  id bigserial primary key,
  title text not null,
  description text not null,
  tag text not null default 'Guide',
  author text not null default 'Admin',
  image_style text,
  created_at timestamptz not null default now()
);

create table if not exists party_posts (
  id bigserial primary key,
  user_name text not null,
  title text not null,
  description text,
  type text not null default 'Party',
  status text not null default 'OPEN',
  created_at timestamptz not null default now()
);

create table if not exists market_posts (
  id bigserial primary key,
  user_name text not null,
  post_type text not null,
  item_name text not null,
  price integer not null,
  created_at timestamptz not null default now()
);

create table if not exists storage_items (
  id bigserial primary key,
  item_name text not null unique,
  amount integer not null default 0,
  updated_at timestamptz not null default now()
);

create table if not exists storage_requests (
  id bigserial primary key,
  user_name text not null,
  item_name text not null,
  request_type text not null,
  price integer,
  amount integer not null,
  created_at timestamptz not null default now()
);

create table if not exists users (
  id bigserial primary key,
  discord_id text not null unique,
  username text not null,
  role text not null default 'user',
  global_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table users add column if not exists role text not null default 'user';

alter table info_posts add column if not exists image_url text;
alter table info_posts add column if not exists image_width integer;
alter table info_posts add column if not exists image_height integer;

alter table party_posts add column if not exists image_url text;
alter table party_posts add column if not exists image_width integer;
alter table party_posts add column if not exists image_height integer;

alter table market_posts add column if not exists image_url text;
alter table market_posts add column if not exists image_width integer;
alter table market_posts add column if not exists image_height integer;

create table if not exists receipt_cards (
  id bigserial primary key,
  title text not null,
  description text,
  image_url text not null,
  image_width integer not null default 0,
  image_height integer not null default 0,
  created_by text not null,
  created_at timestamptz not null default now()
);

create table if not exists storage_cards (
  id bigserial primary key,
  title text not null default '',
  description text,
  tag text not null default 'normal',
  image_url text,
  image_width integer not null default 0,
  image_height integer not null default 0,
  caption text,
  created_by text not null,
  created_at timestamptz not null default now()
);

alter table storage_cards add column if not exists title text not null default '';
alter table storage_cards add column if not exists description text;
alter table storage_cards add column if not exists tag text not null default 'normal';
alter table storage_cards alter column image_url drop not null;

alter table storage_requests add column if not exists status text not null default 'pending';
alter table storage_requests add column if not exists confirmed_by text;
alter table storage_requests add column if not exists confirmed_at timestamptz;
