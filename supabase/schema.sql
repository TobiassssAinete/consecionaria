
-- 1. ACTUALIZACIÓN DE LA TABLA DE VEHÍCULOS
-- Añadimos la columna para guardar el array de URLs si no existe
ALTER TABLE vehicles ADD COLUMN IF NOT EXISTS image_urls TEXT[] DEFAULT '{}';


-- 2. CONFIGURACIÓN DEL ALMACENAMIENTO (STORAGE)
-- Creamos el bucket 'vehicle-images' como público para que las fotos sean accesibles vía URL
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-images', 'vehicle-images', true)
ON CONFLICT (id) DO NOTHING;


-- 3. POLÍTICAS DE SEGURIDAD PARA IMÁGENES (RLS)
-- Nota: Las políticas de storage se aplican a la tabla storage.objects

-- Eliminar políticas previas para evitar duplicados si se re-ejecuta
DROP POLICY IF EXISTS "Permitir lectura pública de imágenes" ON storage.objects;
DROP POLICY IF EXISTS "Permitir subida a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir borrado a usuarios autenticados" ON storage.objects;
DROP POLICY IF EXISTS "Permitir actualización a usuarios autenticados" ON storage.objects;

-- Política: Lectura (Cualquier persona puede ver las fotos de los autos)
CREATE POLICY "Permitir lectura pública de imágenes"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vehicle-images');

-- Política: Inserción (Solo el personal logueado puede subir fotos)
CREATE POLICY "Permitir subida a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vehicle-images');

-- Política: Borrado (Solo el personal logueado puede eliminar fotos)
CREATE POLICY "Permitir borrado a usuarios autenticados"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vehicle-images');

-- Política: Actualización (Para reemplazar archivos si fuera necesario)
CREATE POLICY "Permitir actualización a usuarios autenticados"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'vehicle-images');
