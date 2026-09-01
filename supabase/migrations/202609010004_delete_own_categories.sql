create policy categories_delete_own
on public.categories for delete
to authenticated
using ((select auth.uid()) = user_id and not is_default);

grant delete on public.categories to authenticated;
