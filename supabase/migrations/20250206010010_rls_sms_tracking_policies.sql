-- Enable RLS and allow public select for read-only analytics (optional)
alter table if exists sms_tracking enable row level security;

create policy if not exists "Allow read for sms_tracking"
on sms_tracking
for select
to public
using (true);

-- Updates/inserts are done by functions with service role keys

