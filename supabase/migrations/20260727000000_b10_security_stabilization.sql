-- B10 security stabilization: durable delivery claims, staff-only writes,
-- private upload intent mapping, and enforceable bucket constraints.

CREATE TABLE IF NOT EXISTS public.lead_delivery_outbox (
  lead_id text NOT NULL REFERENCES public.leads (lead_id) ON DELETE CASCADE,
  effect text NOT NULL,
  status text NOT NULL DEFAULT 'processing'
    CHECK (status IN ('processing', 'delivered', 'failed')),
  attempts integer NOT NULL DEFAULT 1 CHECK (attempts > 0),
  locked_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  last_error text,
  PRIMARY KEY (lead_id, effect)
);

ALTER TABLE public.lead_delivery_outbox ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.lead_delivery_outbox FROM anon, authenticated;
GRANT ALL ON public.lead_delivery_outbox TO service_role;

CREATE OR REPLACE FUNCTION public.claim_lead_delivery(p_lead_id text, p_effect text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  claimed boolean;
BEGIN
  INSERT INTO public.lead_delivery_outbox (lead_id, effect)
  VALUES (p_lead_id, p_effect)
  ON CONFLICT (lead_id, effect) DO NOTHING
  RETURNING true INTO claimed;

  IF claimed THEN
    RETURN true;
  END IF;

  UPDATE public.lead_delivery_outbox
  SET
    status = 'processing',
    attempts = attempts + 1,
    locked_at = now(),
    updated_at = now(),
    last_error = NULL
  WHERE lead_id = p_lead_id
    AND effect = p_effect
    AND (
      status = 'failed'
      OR (status = 'processing' AND locked_at < now() - interval '5 minutes')
    )
  RETURNING true INTO claimed;

  RETURN coalesce(claimed, false);
END;
$$;

REVOKE ALL ON FUNCTION public.claim_lead_delivery(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_lead_delivery(text, text) TO service_role;

CREATE OR REPLACE FUNCTION public.is_staff_identity()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT
    coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') IN ('staff', 'admin', 'owner')
    AND coalesce((auth.jwt() -> 'app_metadata' ->> 'disabled')::boolean, false) = false;
$$;

REVOKE ALL ON FUNCTION public.is_staff_identity() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_staff_identity() TO authenticated, service_role;

DROP POLICY IF EXISTS "Admin write settings" ON public.settings;
DROP POLICY IF EXISTS "Admin read all testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admin write testimonials" ON public.testimonials;
DROP POLICY IF EXISTS "Admin write portfolio" ON public.portfolio;
DROP POLICY IF EXISTS "Admin write service_areas" ON public.service_areas;
DROP POLICY IF EXISTS "Staff read all leads" ON public.leads;
DROP POLICY IF EXISTS "Staff update leads" ON public.leads;

CREATE POLICY "Staff write settings"
ON public.settings
FOR ALL
TO authenticated
USING (public.is_staff_identity())
WITH CHECK (public.is_staff_identity());

CREATE POLICY "Staff read all testimonials"
ON public.testimonials
FOR SELECT
TO authenticated
USING (public.is_staff_identity());

CREATE POLICY "Staff write testimonials"
ON public.testimonials
FOR ALL
TO authenticated
USING (public.is_staff_identity())
WITH CHECK (public.is_staff_identity());

CREATE POLICY "Staff write portfolio"
ON public.portfolio
FOR ALL
TO authenticated
USING (public.is_staff_identity())
WITH CHECK (public.is_staff_identity());

CREATE POLICY "Staff write service_areas"
ON public.service_areas
FOR ALL
TO authenticated
USING (public.is_staff_identity())
WITH CHECK (public.is_staff_identity());

CREATE POLICY "Staff read all leads"
ON public.leads
FOR SELECT
TO authenticated
USING (public.is_staff_identity());

CREATE POLICY "Staff update leads"
ON public.leads
FOR UPDATE
TO authenticated
USING (public.is_staff_identity())
WITH CHECK (public.is_staff_identity());

UPDATE storage.buckets
SET
  public = false,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic'],
  file_size_limit = 10485760
WHERE id = 'lead-photos';

DROP POLICY IF EXISTS "Public Insert Access" ON storage.objects;
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;

CREATE TABLE IF NOT EXISTS public.private_file_intents (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bucket_id text NOT NULL DEFAULT 'lead-photos',
  object_key text NOT NULL UNIQUE,
  expected_mime text NOT NULL,
  expected_size bigint NOT NULL CHECK (expected_size > 0 AND expected_size <= 10485760),
  privacy_class text NOT NULL DEFAULT 'lead_private'
    CHECK (privacy_class IN ('lead_private', 'project_private')),
  scan_state text NOT NULL DEFAULT 'pending'
    CHECK (scan_state IN ('pending', 'clean', 'rejected')),
  retention_until timestamptz NOT NULL DEFAULT now() + interval '90 days',
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

ALTER TABLE public.private_file_intents ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.private_file_intents FROM anon, authenticated;
GRANT ALL ON public.private_file_intents TO service_role;
