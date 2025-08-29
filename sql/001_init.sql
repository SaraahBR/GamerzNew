create table if not exists users (
  id         text primary key default gen_random_uuid(),
  email      text not null unique,
  name       text,
  created_at timestamptz not null default now()
);

create table if not exists games (
  id          serial primary key,
  title       text not null,
  img         text not null,
  genre       text[] not null,
  year        int  not null,
  dev         text not null,
  pub         text not null,
  description text not null,
  steam       text not null,
  created_by  text references users(id),
  created_at  timestamptz not null default now(),
  constraint game_title_year_dev_unique unique (title, year, dev)
);

create table if not exists favorites (
  id         serial primary key,
  user_id    text not null references users(id) on delete cascade,
  game_id    int  not null references games(id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint favorite_unique unique (user_id, game_id)
);

create table if not exists sessions (
  id         text primary key,
  user_id    text references users(id) on delete cascade,
  created_at timestamptz not null default now(),
  ttl_sec    int not null default 604800, -- 7 dias
  data       jsonb
);

-- Índices úteis
create index if not exists idx_games_title on games (title);
create index if not exists idx_favorites_user on favorites (user_id);
create index if not exists idx_sessions_user on sessions (user_id);
