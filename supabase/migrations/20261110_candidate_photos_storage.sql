-- ==============================================================
-- SUPABASE STORAGE BUCKET CONFIGURATION & RLS POLICIES
-- Bucket: candidate-photos (PRIVATE)
-- Structure: candidate-photos/{authenticated_user_id}/{unique_filename}.jpg
-- ==============================================================

-- 1. Create Private Bucket if not already existing
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'candidate-photos',
    'candidate-photos',
    false, -- STRICTLY PRIVATE: Never public
    2097152, -- 2MB maximum file size limit
    ARRAY['image/jpeg', 'image/png', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 2097152,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/jpg'];

-- 2. Enable Row Level Security (RLS) on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Authenticated candidate can upload ONLY to their own UUID folder
-- candidate-photos/{auth.uid()}/photo_xyz.jpg
DROP POLICY IF EXISTS "Candidates can upload own photo" ON storage.objects;
CREATE POLICY "Candidates can upload own photo"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'candidate-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 4. Policy: Candidates can view / download ONLY their own uploaded photo
DROP POLICY IF EXISTS "Candidates can view own photo" ON storage.objects;
CREATE POLICY "Candidates can view own photo"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'candidate-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 5. Policy: Candidates can update / replace their own photo
DROP POLICY IF EXISTS "Candidates can update own photo" ON storage.objects;
CREATE POLICY "Candidates can update own photo"
ON storage.objects FOR UPDATE
TO authenticated
USING (
    bucket_id = 'candidate-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 6. Policy: Candidates can delete their own photo
DROP POLICY IF EXISTS "Candidates can delete own photo" ON storage.objects;
CREATE POLICY "Candidates can delete own photo"
ON storage.objects FOR DELETE
TO authenticated
USING (
    bucket_id = 'candidate-photos'
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 7. Policy: Verified University Administrators can view ALL candidate photos
DROP POLICY IF EXISTS "Admins can view all candidate photos" ON storage.objects;
CREATE POLICY "Admins can view all candidate photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
    bucket_id = 'candidate-photos'
    AND (
        (auth.jwt() ->> 'role') = 'admin'
        OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
        OR (auth.jwt() ->> 'email') LIKE '%@convocation.iu.ac.bd'
    )
);
