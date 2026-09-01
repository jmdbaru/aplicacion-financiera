-- Permite eliminar únicamente cuentas del propio usuario.
-- Las claves foráneas con ON DELETE RESTRICT conservan automáticamente
-- cualquier cuenta con movimientos o configuraciones vinculadas.
create policy "financial_accounts_delete_own"
on public.financial_accounts
for delete
to authenticated
using ((select auth.uid()) = user_id);

grant delete on public.financial_accounts to authenticated;
