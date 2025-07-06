-- Ajout d'une colonne short_code pour le lien court guidance
alter table guidance_token add column if not exists short_code text unique;
create unique index if not exists idx_guidance_token_short_code on guidance_token(short_code); 