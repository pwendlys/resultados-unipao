
-- Create fiscal_meeting_minutes table
create table public.fiscal_meeting_minutes (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  meeting_date date not null,
  meeting_type text not null default 'ordinária',
  location text,
  created_by uuid not null,
  minutes_text text,
  status text not null default 'draft',
  snapshot jsonb,
  pdf_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create fiscal_meeting_minutes_participants table
create table public.fiscal_meeting_minutes_participants (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references fiscal_meeting_minutes(id) on delete cascade,
  user_id uuid not null,
  participant_role text not null,
  display_name_snapshot text,
  is_required_signature boolean default true,
  created_at timestamptz default now()
);

-- Create fiscal_meeting_minutes_reports table
create table public.fiscal_meeting_minutes_reports (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references fiscal_meeting_minutes(id) on delete cascade,
  fiscal_report_id uuid not null,
  approved boolean default true,
  created_at timestamptz default now()
);

-- Create fiscal_meeting_minutes_signature_sources table
create table public.fiscal_meeting_minutes_signature_sources (
  id uuid primary key default gen_random_uuid(),
  minutes_id uuid not null references fiscal_meeting_minutes(id) on delete cascade,
  user_id uuid not null,
  signature_payload text not null,
  source_report_id uuid not null,
  source_signature_id uuid,
  signed_at_original timestamptz,
  unique(minutes_id, user_id),
  created_at timestamptz default now()
);

-- Enable RLS on all tables
alter table public.fiscal_meeting_minutes enable row level security;
alter table public.fiscal_meeting_minutes_participants enable row level security;
alter table public.fiscal_meeting_minutes_reports enable row level security;
alter table public.fiscal_meeting_minutes_signature_sources enable row level security;

-- RLS for fiscal_meeting_minutes: Admin/Tesoureiro full CRUD
create policy "Admin and Treasurer full access to meeting minutes"
on public.fiscal_meeting_minutes for all
to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role));

-- Fiscal can view meeting minutes
create policy "Fiscal can view meeting minutes"
on public.fiscal_meeting_minutes for select
to authenticated
using (has_role(auth.uid(), 'fiscal'::app_role));

-- RLS for participants
create policy "Admin and Treasurer full access to meeting participants"
on public.fiscal_meeting_minutes_participants for all
to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role));

create policy "Fiscal can view meeting participants"
on public.fiscal_meeting_minutes_participants for select
to authenticated
using (has_role(auth.uid(), 'fiscal'::app_role));

-- RLS for reports
create policy "Admin and Treasurer full access to meeting reports"
on public.fiscal_meeting_minutes_reports for all
to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role));

create policy "Fiscal can view meeting reports"
on public.fiscal_meeting_minutes_reports for select
to authenticated
using (has_role(auth.uid(), 'fiscal'::app_role));

-- RLS for signature sources
create policy "Admin and Treasurer full access to meeting signature sources"
on public.fiscal_meeting_minutes_signature_sources for all
to authenticated
using (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role))
with check (has_role(auth.uid(), 'admin'::app_role) or has_role(auth.uid(), 'tesoureiro'::app_role));

create policy "Fiscal can view meeting signature sources"
on public.fiscal_meeting_minutes_signature_sources for select
to authenticated
using (has_role(auth.uid(), 'fiscal'::app_role));
