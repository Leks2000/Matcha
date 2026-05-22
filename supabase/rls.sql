alter table users enable row level security;
alter table swipes enable row level security;
alter table matches enable row level security;

create policy "users_select" on users
  for select using (true);

create policy "users_insert" on users
  for insert with check (true);

create policy "swipes_insert" on swipes
  for insert with check (true);

create policy "swipes_select" on swipes
  for select using (true);

create policy "matches_select" on matches
  for select using (true);
