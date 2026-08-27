-- Contractor estimating domain for Sky's the Limit Painting LLC.
-- All internal-cost records remain server-managed; RLS is enabled by default.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.estimator_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.estimator_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  company_name text,
  phone text,
  email text,
  address_line1 text,
  city text,
  state text,
  zip text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL REFERENCES public.estimator_customers(id) ON DELETE CASCADE,
  address_line1 text NOT NULL,
  city text,
  state text,
  zip text,
  property_kind text NOT NULL CHECK (property_kind IN ('residential', 'commercial')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'Sky''s the Limit Painting LLC',
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  manufacturer text,
  product_name text NOT NULL,
  sku text,
  material_type text NOT NULL CHECK (material_type IN ('paint', 'primer', 'supply', 'equipment')),
  finish text,
  interior_exterior text CHECK (interior_exterior IN ('interior', 'exterior', 'both')),
  coverage_per_gallon numeric(10,2),
  container_size_gallons numeric(10,2),
  is_configurable boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_material_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id uuid REFERENCES public.estimator_materials(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  supplier text,
  sku text,
  unit_price numeric(12,2) NOT NULL CHECK (unit_price >= 0),
  currency text NOT NULL DEFAULT 'USD',
  source text NOT NULL CHECK (source IN ('channel3', 'cache', 'contractor', 'manual')),
  retrieved_at timestamptz,
  expires_at timestamptz,
  entered_by text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_estimates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES public.estimator_customers(id) ON DELETE SET NULL,
  property_id uuid REFERENCES public.estimator_properties(id) ON DELETE SET NULL,
  job_name text NOT NULL,
  project_kind text NOT NULL CHECK (project_kind IN ('interior', 'exterior', 'cabinets')),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'accepted', 'rejected', 'revised')),
  prep_level text NOT NULL CHECK (prep_level IN ('light', 'standard', 'heavy')),
  job_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  calculation_snapshot jsonb NOT NULL DEFAULT '{}'::jsonb,
  customer_price numeric(12,2) NOT NULL DEFAULT 0 CHECK (customer_price >= 0),
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_estimate_surfaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimator_estimates(id) ON DELETE CASCADE,
  surface_name text NOT NULL,
  surface_type text NOT NULL,
  area_sqft numeric(12,2) NOT NULL DEFAULT 0,
  coats integer NOT NULL DEFAULT 2 CHECK (coats > 0),
  prep_level text NOT NULL CHECK (prep_level IN ('light', 'standard', 'heavy')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_estimate_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid NOT NULL REFERENCES public.estimator_estimates(id) ON DELETE CASCADE,
  material_id uuid REFERENCES public.estimator_materials(id) ON DELETE SET NULL,
  material_price_id uuid REFERENCES public.estimator_material_prices(id) ON DELETE SET NULL,
  name text NOT NULL,
  required_quantity numeric(12,2) NOT NULL DEFAULT 0,
  purchased_quantity numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  total_cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  estimate_id uuid UNIQUE REFERENCES public.estimator_estimates(id) ON DELETE SET NULL,
  customer_id uuid REFERENCES public.estimator_customers(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'accepted' CHECK (status IN ('accepted', 'deposit_requested', 'deposit_paid', 'in_progress', 'final_invoice', 'paid', 'closed')),
  job_name text NOT NULL,
  accepted_price numeric(12,2) NOT NULL DEFAULT 0,
  estimated_cost numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_job_actuals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.estimator_jobs(id) ON DELETE CASCADE,
  actual_labor_hours numeric(12,2) NOT NULL DEFAULT 0,
  actual_material_cost numeric(12,2) NOT NULL DEFAULT 0,
  subcontractor_cost numeric(12,2) NOT NULL DEFAULT 0,
  equipment_cost numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.estimator_jobs(id) ON DELETE CASCADE,
  invoice_number text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid')),
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  due_date date,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.estimator_invoices(id) ON DELETE CASCADE,
  amount numeric(12,2) NOT NULL CHECK (amount >= 0),
  received_at timestamptz NOT NULL DEFAULT now(),
  method text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.estimator_change_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id uuid NOT NULL REFERENCES public.estimator_jobs(id) ON DELETE CASCADE,
  description text NOT NULL,
  amount numeric(12,2) NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'approved', 'declined')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS estimator_customers_name_idx ON public.estimator_customers (name);
CREATE INDEX IF NOT EXISTS estimator_estimates_customer_idx ON public.estimator_estimates (customer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS estimator_material_prices_product_idx ON public.estimator_material_prices (product_name, created_at DESC);
CREATE INDEX IF NOT EXISTS estimator_jobs_status_idx ON public.estimator_jobs (status, created_at DESC);
CREATE INDEX IF NOT EXISTS estimator_invoices_job_idx ON public.estimator_invoices (job_id, created_at DESC);

ALTER TABLE public.estimator_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_estimates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_estimate_surfaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_estimate_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_job_actuals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estimator_change_orders ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS estimator_customers_updated_at ON public.estimator_customers;
CREATE TRIGGER estimator_customers_updated_at BEFORE UPDATE ON public.estimator_customers FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_properties_updated_at ON public.estimator_properties;
CREATE TRIGGER estimator_properties_updated_at BEFORE UPDATE ON public.estimator_properties FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_settings_updated_at ON public.estimator_settings;
CREATE TRIGGER estimator_settings_updated_at BEFORE UPDATE ON public.estimator_settings FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_materials_updated_at ON public.estimator_materials;
CREATE TRIGGER estimator_materials_updated_at BEFORE UPDATE ON public.estimator_materials FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_estimates_updated_at ON public.estimator_estimates;
CREATE TRIGGER estimator_estimates_updated_at BEFORE UPDATE ON public.estimator_estimates FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_jobs_updated_at ON public.estimator_jobs;
CREATE TRIGGER estimator_jobs_updated_at BEFORE UPDATE ON public.estimator_jobs FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_job_actuals_updated_at ON public.estimator_job_actuals;
CREATE TRIGGER estimator_job_actuals_updated_at BEFORE UPDATE ON public.estimator_job_actuals FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_invoices_updated_at ON public.estimator_invoices;
CREATE TRIGGER estimator_invoices_updated_at BEFORE UPDATE ON public.estimator_invoices FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
DROP TRIGGER IF EXISTS estimator_change_orders_updated_at ON public.estimator_change_orders;
CREATE TRIGGER estimator_change_orders_updated_at BEFORE UPDATE ON public.estimator_change_orders FOR EACH ROW EXECUTE FUNCTION public.estimator_set_updated_at();
