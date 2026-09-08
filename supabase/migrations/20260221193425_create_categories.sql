-- Migración base recuperada de supabase_migrations.schema_migrations.
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text not null default 'tag',
  color text not null default '#6B7280',
  type text not null check (type in ('expense', 'income', 'both')),
  user_id uuid references auth.users(id) on delete cascade,
  is_default boolean default false,
  created_at timestamptz default now()
);

alter table public.categories enable row level security;

create policy "Users can view their own and default categories"
  on public.categories for select
  using (is_default = true or auth.uid() = user_id);

create policy "Users can insert their own categories"
  on public.categories for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own categories"
  on public.categories for update
  using (auth.uid() = user_id and is_default = false);

create policy "Users can delete their own categories"
  on public.categories for delete
  using (auth.uid() = user_id and is_default = false);

insert into public.categories (name, icon, color, type, is_default)
values
  ('Alimentacion', 'shopping-cart', '#10B981', 'expense', true),
  ('Transporte', 'car', '#3B82F6', 'expense', true),
  ('Ocio', 'gamepad-2', '#8B5CF6', 'expense', true),
  ('Hogar', 'home', '#F59E0B', 'expense', true),
  ('Salud', 'heart-pulse', '#EF4444', 'expense', true),
  ('Ropa', 'shirt', '#EC4899', 'expense', true),
  ('Educacion', 'graduation-cap', '#6366F1', 'expense', true),
  ('Suscripciones', 'repeat', '#14B8A6', 'expense', true),
  ('Restaurantes', 'utensils', '#F97316', 'expense', true),
  ('Salario', 'banknote', '#10B981', 'income', true),
  ('Freelance', 'laptop', '#3B82F6', 'income', true),
  ('Inversiones', 'trending-up', '#8B5CF6', 'income', true),
  ('Otros Ingresos', 'plus-circle', '#6B7280', 'income', true),
  ('Otros Gastos', 'minus-circle', '#6B7280', 'expense', true);

create index idx_categories_default
  on public.categories(is_default)
  where is_default = true;
