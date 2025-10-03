-- Fix security issues: Implement proper role-based access control and input validation

-- 1. Create app_role enum for type safety
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- 2. Create user_roles table (separate from profiles to prevent privilege escalation)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Users can view their own roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Create security definer function to check roles (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 4. Update medicamentos RLS policies to enforce admin-only modifications
DROP POLICY IF EXISTS "Authenticated users can create medicines" ON public.medicamentos;
DROP POLICY IF EXISTS "Authenticated users can update medicines" ON public.medicamentos;
DROP POLICY IF EXISTS "Authenticated users can delete medicines" ON public.medicamentos;

CREATE POLICY "Only admins can create medicines"
  ON public.medicamentos
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can update medicines"
  ON public.medicamentos
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Only admins can delete medicines"
  ON public.medicamentos
  FOR DELETE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Add database-level input validation constraints
ALTER TABLE public.medicamentos 
  ADD CONSTRAINT nome_length CHECK (length(nome) > 0 AND length(nome) <= 200),
  ADD CONSTRAINT principio_ativo_length CHECK (length(principio_ativo) > 0 AND length(principio_ativo) <= 500),
  ADD CONSTRAINT classe_length CHECK (length(classe) > 0 AND length(classe) <= 100),
  ADD CONSTRAINT indicacao_length CHECK (length(indicacao) > 0 AND length(indicacao) <= 2000),
  ADD CONSTRAINT especies_count CHECK (array_length(especies, 1) >= 1 AND array_length(especies, 1) <= 20),
  ADD CONSTRAINT metatags_count CHECK (array_length(metatags, 1) >= 1 AND array_length(metatags, 1) <= 50);

-- 6. Migrate existing admin users from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'admin'::public.app_role
FROM public.profiles
WHERE is_admin = true
ON CONFLICT (user_id, role) DO NOTHING;

-- 7. Remove is_admin column from profiles (no longer needed)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS is_admin;

-- 8. Update storage policies for better security
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete images" ON storage.objects;

CREATE POLICY "Only admins can upload images"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'medicamentos-images' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only admins can update images"
  ON storage.objects
  FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'medicamentos-images' AND
    public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY "Only admins can delete images"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'medicamentos-images' AND
    public.has_role(auth.uid(), 'admin')
  );