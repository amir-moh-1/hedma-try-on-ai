insert into storage.buckets (id, name, public) values ('branding', 'branding', true) on conflict (id) do nothing;

create policy "branding public read" on storage.objects for select using (bucket_id = 'branding');
create policy "admin upload branding" on storage.objects for insert to authenticated with check (bucket_id = 'branding' and public.has_role(auth.uid(), 'admin'));
create policy "admin update branding" on storage.objects for update to authenticated using (bucket_id = 'branding' and public.has_role(auth.uid(), 'admin'));
create policy "admin delete branding" on storage.objects for delete to authenticated using (bucket_id = 'branding' and public.has_role(auth.uid(), 'admin'));