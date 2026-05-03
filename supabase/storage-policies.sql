-- Phase 4 storage policy baseline for private KYC documents.

insert into storage.buckets (id, name, public)
values ('kyc-documents', 'kyc-documents', false)
on conflict (id) do update set public = false;

-- KYC documents are private and should be accessed only via service-role APIs
-- that issue short-lived signed URLs for admin review.
-- RLS policies are intentionally omitted to avoid accidental client access.
