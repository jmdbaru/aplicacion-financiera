-- get_budget_overview se ejecuta como SECURITY INVOKER y normaliza el periodo
-- Versión asignada al reconciliar el historial remoto.
-- mediante esta función pura. Los usuarios autenticados necesitan ejecutarla
-- indirectamente al cargar Presupuestos y el Resumen.
grant execute on function public.normalize_budget_period(date, smallint) to authenticated;
