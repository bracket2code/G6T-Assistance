-- Create storage bucket for signatures if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('signatures', 'signatures', false)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for signatures bucket
CREATE POLICY "Users can upload their own signatures"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own signatures"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (
    -- User can view their own signatures
    (storage.foldername(name))[1] = auth.uid()::text
    OR
    -- Admins and managers can view all signatures
    EXISTS (
      SELECT 1 FROM auth.users au
      JOIN public.users u ON u.id = au.id
      JOIN public.roles r ON r.id = u.role_id
      WHERE au.id = auth.uid()
      AND r.name IN ('admin', 'manager')
    )
  )
);

CREATE POLICY "Users can update their own signatures"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
)
WITH CHECK (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own signatures"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' AND
  (storage.foldername(name))[1] = auth.uid()::text
);