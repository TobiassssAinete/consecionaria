
-- 1. ACTUALIZACIÓN DE LA TABLA DE VEHÍCULOS
-- Añadimos la columna para guardar el array de URLs si no existe
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';

-- Añadimos la columna entry_date para la fecha de toma manual
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS entry_date DATE DEFAULT CURRENT_DATE;

-- Actualizamos registros existentes para que tengan la fecha de creación como fecha de toma inicial
UPDATE vehicles SET entry_date = created_at::DATE WHERE entry_date IS NULL;

-- 2. CONFIGURACIÓN DEL ALMACENAMIENTO (STORAGE)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;

-- 3. POLÍTICAS DE SEGURIDAD PARA IMÁGENES (RLS)
DROP POLICY IF EXISTS "Permitir lectura pública de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrado a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización a usuarios autenticados" ON storage.objects;

CREATE POLICY "Permitir lectura pública de imágenes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Permitir subida a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

CREATE POLICY "Permitir borrado a usuarios autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');

CREATE POLICY "Permitir actualización a usuarios autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images');
