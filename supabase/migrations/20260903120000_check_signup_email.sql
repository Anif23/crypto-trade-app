-- Check signup email availability without exposing profile or auth user records.
CREATE OR REPLACE FUNCTION public.is_signup_email_available(p_email text)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, auth
AS $$
  SELECT NOT EXISTS (
    SELECT 1
    FROM auth.users
    WHERE lower(email) = lower(trim(p_email))
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE lower(email) = lower(trim(p_email))
  );
$$;

REVOKE ALL ON FUNCTION public.is_signup_email_available(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_signup_email_available(text) TO anon, authenticated;
