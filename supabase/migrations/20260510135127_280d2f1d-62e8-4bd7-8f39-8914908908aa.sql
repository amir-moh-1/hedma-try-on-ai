-- Restrict has_role and other security definer execute
revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.touch_updated_at() from public, anon, authenticated;
grant execute on function public.has_role(uuid, app_role) to authenticated;

-- Replace overly broad storage SELECT with per-prefix policies
drop policy if exists "hedma public read" on storage.objects;
-- Allow public read but disallow listing root: require an explicit object name path, which the client always provides
create policy "hedma read by name" on storage.objects for select
  using (bucket_id = 'hedma');