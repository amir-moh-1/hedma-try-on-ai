
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1. notifications (admin-wide)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content TEXT,
  type TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage notifications" ON public.notifications
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);

-- 2. user_notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS user_notifications_user_id_idx ON public.user_notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_notifications TO authenticated;
GRANT ALL ON public.user_notifications TO service_role;
ALTER TABLE public.user_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users read own notifications" ON public.user_notifications
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "users update own notifications" ON public.user_notifications
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);
CREATE POLICY "admins insert notifications" ON public.user_notifications
  FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins delete notifications" ON public.user_notifications
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 3. password_recovery_requests
CREATE TABLE IF NOT EXISTS public.password_recovery_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL,
  phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.password_recovery_requests TO authenticated;
GRANT SELECT, INSERT ON public.password_recovery_requests TO anon;
GRANT ALL ON public.password_recovery_requests TO service_role;
ALTER TABLE public.password_recovery_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit recovery request" ON public.password_recovery_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);
CREATE POLICY "admins manage recovery requests" ON public.password_recovery_requests
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (true);

-- 4. admin_update_user RPC
CREATE OR REPLACE FUNCTION public.admin_update_user(
  target_user_id UUID,
  new_username TEXT,
  new_email TEXT,
  new_password TEXT DEFAULT NULL,
  new_phone TEXT DEFAULT NULL,
  new_full_name TEXT DEFAULT NULL
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.profiles
    SET username = COALESCE(new_username, username),
        phone = COALESCE(new_phone, phone),
        full_name = COALESCE(new_full_name, full_name),
        email = COALESCE(new_email, email),
        plain_password = COALESCE(new_password, plain_password)
  WHERE id = target_user_id;

  UPDATE auth.users
    SET email = COALESCE(new_email, email),
        encrypted_password = CASE
          WHEN new_password IS NOT NULL AND length(new_password) > 0
          THEN extensions.crypt(new_password, extensions.gen_salt('bf'))
          ELSE encrypted_password
        END,
        raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb)
          || jsonb_build_object(
            'username', COALESCE(new_username, raw_user_meta_data->>'username'),
            'phone', COALESCE(new_phone, raw_user_meta_data->>'phone'),
            'full_name', COALESCE(new_full_name, raw_user_meta_data->>'full_name'),
            'plain_password', COALESCE(new_password, raw_user_meta_data->>'plain_password')
          ),
        updated_at = now()
  WHERE id = target_user_id;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_user(UUID, TEXT, TEXT, TEXT, TEXT, TEXT) TO authenticated;
