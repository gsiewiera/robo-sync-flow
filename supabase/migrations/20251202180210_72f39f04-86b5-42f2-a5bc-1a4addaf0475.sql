-- Create storage bucket for offer PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('offer-pdfs', 'offer-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for authenticated users to upload offer PDFs
CREATE POLICY "Authenticated users can upload offer PDFs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'offer-pdfs' AND
  auth.uid() IS NOT NULL
);

-- Policy for authenticated users to read offer PDFs
CREATE POLICY "Authenticated users can read offer PDFs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'offer-pdfs' AND
  auth.uid() IS NOT NULL
);

-- Policy for authenticated users to update offer PDFs
CREATE POLICY "Authenticated users can update offer PDFs"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'offer-pdfs' AND
  auth.uid() IS NOT NULL
);

-- Policy for authenticated users to delete offer PDFs
CREATE POLICY "Authenticated users can delete offer PDFs"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'offer-pdfs' AND
  auth.uid() IS NOT NULL
);