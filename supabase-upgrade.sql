-- PROFITFLOW v8 Supabase upgrade
-- Supabase SQL Editor에서 1번만 실행하면 수동계좌의 오늘손익/월간손익/승률/거래수까지 클라우드에 저장됩니다.

alter table manual_accounts add column if not exists today numeric default 0;
alter table manual_accounts add column if not exists month numeric default 0;
alter table manual_accounts add column if not exists win_rate numeric default 0;
alter table manual_accounts add column if not exists trades numeric default 0;
alter table manual_accounts add column if not exists updated_at timestamptz default now();

alter table deposit_withdrawals add column if not exists time text;
alter table deposit_withdrawals add column if not exists memo text;

alter table trading_journal add column if not exists updated_at timestamptz default now();
