-- Restrict profiles SELECT to owner only
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Lock down user_roles writes: deny all client-side INSERT/UPDATE/DELETE
CREATE POLICY "No client inserts on user_roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (false);

CREATE POLICY "No client updates on user_roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (false)
WITH CHECK (false);

CREATE POLICY "No client deletes on user_roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (false);