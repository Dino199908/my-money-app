
create extension if not exists pgcrypto;

create table if not exists budgets (
  id uuid primary key default gen_random_uuid(),
  name text default 'My Money',
  monthly_income numeric default 3200,
  selected_month text,
  theme text default 'midnight',
  budgets jsonb default '{}'::jsonb,
  share_code text unique not null,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table if not exists budget_members (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references budgets(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  user_email text,
  role text default 'editor',
  created_at timestamptz default now(),
  unique(budget_id, user_id)
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  budget_id uuid references budgets(id) on delete cascade,
  type text not null check (type in ('income', 'expense')),
  amount numeric not null,
  category text default 'Other',
  description text default '',
  date text not null,
  created_at timestamptz default now()
);

alter table budgets enable row level security;
alter table budget_members enable row level security;
alter table transactions enable row level security;

create policy "budgets read for members" on budgets for select using (
  exists (select 1 from budget_members where budget_members.budget_id = budgets.id and budget_members.user_id = auth.uid())
);
create policy "budgets insert for owner" on budgets for insert with check (owner_id = auth.uid());
create policy "budgets update for members" on budgets for update using (
  exists (select 1 from budget_members where budget_members.budget_id = budgets.id and budget_members.user_id = auth.uid())
);

create policy "members read" on budget_members for select using (
  user_id = auth.uid() or exists (select 1 from budget_members bm where bm.budget_id = budget_members.budget_id and bm.user_id = auth.uid())
);
create policy "members insert self" on budget_members for insert with check (user_id = auth.uid());

create policy "transactions read for members" on transactions for select using (
  exists (select 1 from budget_members where budget_members.budget_id = transactions.budget_id and budget_members.user_id = auth.uid())
);
create policy "transactions insert for members" on transactions for insert with check (
  exists (select 1 from budget_members where budget_members.budget_id = transactions.budget_id and budget_members.user_id = auth.uid())
);
create policy "transactions update for members" on transactions for update using (
  exists (select 1 from budget_members where budget_members.budget_id = transactions.budget_id and budget_members.user_id = auth.uid())
);
create policy "transactions delete for members" on transactions for delete using (
  exists (select 1 from budget_members where budget_members.budget_id = transactions.budget_id and budget_members.user_id = auth.uid())
);
