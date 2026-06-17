-- PROFITFLOW V8 저장 오류 수정 SQL
-- Supabase SQL Editor에서 한 번만 실행하세요.

alter table if exists public.deposit_withdrawals
  add column if not exists time text;

alter table if exists public.manual_accounts
  add column if not exists today numeric default 0,
  add column if not exists month numeric default 0,
  add column if not exists win_rate numeric default 0,
  add column if not exists trades numeric default 0;

create unique index if not exists manual_accounts_exchange_key
on public.manual_accounts(exchange);

alter table if exists public.trading_journal
  add column if not exists content text,
  add column if not exists note text;

alter table public.deposit_withdrawals enable row level security;
alter table public.manual_accounts enable row level security;
alter table public.trading_journal enable row level security;

drop policy if exists "profitflow deposit withdrawals all" on public.deposit_withdrawals;
create policy "profitflow deposit withdrawals all"
on public.deposit_withdrawals
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "profitflow manual accounts all" on public.manual_accounts;
create policy "profitflow manual accounts all"
on public.manual_accounts
for all
to anon, authenticated
using (true)
with check (true);

drop policy if exists "profitflow trading journal all" on public.trading_journal;
create policy "profitflow trading journal all"
on public.trading_journal
for all
to anon, authenticated
using (true)
with check (true);
