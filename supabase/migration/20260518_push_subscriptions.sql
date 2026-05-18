-- Migration: push_subscriptions table for Web Push notifications
-- Run this in Supabase SQL Editor

create table if not exists public.push_subscriptions (
  id          uuid primary key default gen_random_uuid(),
  endpoint    text not null unique,
  p256dh      text not null,
  auth        text not null,
  created_at  timestamptz not null default now()
);

-- Only admin (service_role) can read/write subscriptions
alter table public.push_subscriptions enable row level security;

-- Allow the edge function (service role) to do everything
create policy "service_role_all" on public.push_subscriptions
  for all
  using (true)
  with check (true);

-- Allow authenticated admin users to insert/delete their own subscriptions
create policy "admin_upsert" on public.push_subscriptions
  for insert
  to authenticated
  with check (true);

create policy "admin_delete" on public.push_subscriptions
  for delete
  to authenticated
  using (true);

create policy "admin_select" on public.push_subscriptions
  for select
  to authenticated
  using (true);
