-- 0003 — Align schema with new app features:
--   * Extend deal_status enum (pending / refund / others) used by the
--     Tawaran (deals) intelligence board.
--   * Add team_leader_id to agent_profiles for the Team Leader hierarchy.
-- Safe & additive: enum values added with IF NOT EXISTS; column added with
-- IF NOT EXISTS. The legacy 'processing' value is kept (unused, harmless).

-- --- Deal statuses ---------------------------------------------------------
alter type deal_status add value if not exists 'pending';
alter type deal_status add value if not exists 'refund';
alter type deal_status add value if not exists 'others';

-- --- Teams -----------------------------------------------------------------
alter table public.agent_profiles
  add column if not exists team_leader_id uuid references public.users(id) on delete set null;

create index if not exists idx_agent_profiles_team_leader
  on public.agent_profiles(team_leader_id);

comment on column public.agent_profiles.team_leader_id is
  'The Team Leader (users.id) this agent reports to. NULL = no team / is a leader.';
