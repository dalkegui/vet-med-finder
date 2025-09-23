-- Enable extensions for search functionality
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create medicamentos table
CREATE TABLE IF NOT EXISTS public.medicamentos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  principio_ativo text NOT NULL,
  classe text NOT NULL,
  especies text[] NOT NULL,
  indicacao text NOT NULL,
  metatags text[] NOT NULL,
  imagem_path text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  search_vector tsvector
);

-- Enable Row Level Security
ALTER TABLE public.medicamentos ENABLE ROW LEVEL SECURITY;

-- RLS Policies - medicines are publicly readable but only admins can modify
CREATE POLICY "Anyone can view medicines" 
ON public.medicamentos 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can create medicines" 
ON public.medicamentos 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update medicines" 
ON public.medicamentos 
FOR UPDATE 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete medicines" 
ON public.medicamentos 
FOR DELETE 
USING (auth.uid() IS NOT NULL);

-- Trigger function to update search_vector
CREATE OR REPLACE FUNCTION public.medicamentos_search_vector_update() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.nome,'')), 'A') ||
    setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.principio_ativo,'')), 'B') ||
    setweight(to_tsvector('pg_catalog.simple', array_to_string(NEW.metatags,' ')), 'B') ||
    setweight(to_tsvector('pg_catalog.simple', coalesce(NEW.indicacao,'')), 'C');
  RETURN NEW;
END
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic search vector updates
CREATE TRIGGER tsvectorupdate 
BEFORE INSERT OR UPDATE ON public.medicamentos 
FOR EACH ROW EXECUTE FUNCTION public.medicamentos_search_vector_update();

-- Create indexes for efficient search
CREATE INDEX IF NOT EXISTS idx_medicamentos_search ON public.medicamentos USING GIN (search_vector);
CREATE INDEX IF NOT EXISTS idx_medicamentos_trgm_nome ON public.medicamentos USING gin (nome gin_trgm_ops);

-- Create profiles table for user management
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  is_admin boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Seed example: IZOOT B12
INSERT INTO public.medicamentos (nome, principio_ativo, classe, especies, indicacao, metatags, imagem_path)
VALUES (
  'IZOOT B12',
  'Imodicarb + Vitamina B12',
  'Antibiótico',
  ARRAY['Cães','Gatos','Bovinos','Equinos','Ovinos','Aves','Peixes','Suínos','Roedores'],
  'Babésia; Anaplasmose; Tristeza parasitária; Apatia; Anorexia; Abatimento.',
  ARRAY['babesia','anaplasmose','tristeza parasitaria','apatia','anorexia','abatimento','isolamento','anemia','fraqueza'],
  NULL
);

-- Create storage bucket for medicine images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('medicamentos-images', 'medicamentos-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for medicine images
CREATE POLICY "Public can view medicine images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'medicamentos-images');

CREATE POLICY "Authenticated users can upload medicine images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'medicamentos-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update medicine images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'medicamentos-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete medicine images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'medicamentos-images' AND auth.uid() IS NOT NULL);