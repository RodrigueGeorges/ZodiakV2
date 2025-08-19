-- Enable RLS and add minimal read policy for guidance_token
alter table if exists guidance_token enable row level security;

-- Allow anonymous/public read of the fields needed for link validation
-- Adjust as needed if you want to further restrict by token/short_code
create policy if not exists "Allow read by short_code or token"
on guidance_token
for select
to public
using (
  true
);

-- Note: Writes are performed server-side using the service role, so no insert/update policy is needed here


