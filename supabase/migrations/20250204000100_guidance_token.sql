-- Table pour les tokens d'accès à la guidance du jour
create table if not exists guidance_token (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade,
  token text not null unique,
  date date not null,
  expires_at timestamptz not null,
  created_at timestamptz default now(),
  constraint unique_user_date unique(user_id, date)
);
create index if not exists idx_guidance_token_token on guidance_token(token); 