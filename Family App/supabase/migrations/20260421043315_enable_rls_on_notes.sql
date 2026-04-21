alter table public.notes enable row level security;

create policy "anyone can read notes"
  on public.notes
  for select
  to public
  using (true);

create policy "anyone can write a note"
  on public.notes
  for insert
  to public
  with check (true);
