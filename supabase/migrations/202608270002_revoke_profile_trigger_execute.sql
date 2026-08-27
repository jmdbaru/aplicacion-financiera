-- Impide que roles de API invoquen directamente la función SECURITY DEFINER
-- usada exclusivamente por el trigger de alta de Auth.

revoke execute on function public.handle_new_user() from public, anon, authenticated;
