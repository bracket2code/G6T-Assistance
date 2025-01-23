-- Drop existing policies
DROP POLICY IF EXISTS "Users can upload their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can view their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own signatures" ON storage.objects;

-- Create improved storage policies for signatures bucket
CREATE POLICY "Enable signature uploads for authenticated users"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' AND
  auth.uid()::text = SPLIT_PART(name, '_', 1)
);

CREATE POLICY "Enable signature access for authenticated users"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (
    auth.uid()::text = SPLIT_PART(name, '_', 1)
    OR
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN public.users u ON u.id = au.id
      JOIN public.roles r ON r.id = u.role_id
      WHERE au.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  )
);

CREATE POLICY "Enable signature updates for authenticated users"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  auth.uid()::text = SPLIT_PART(name, '_', 1)
)
WITH CHECK (
  bucket_id = 'signatures' AND
  auth.uid()::text = SPLIT_PART(name, '_', 1)
);

CREATE POLICY "Enable signature deletion for authenticated users"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  auth.uid()::text = SPLIT_PART(name, '_', 1)
);