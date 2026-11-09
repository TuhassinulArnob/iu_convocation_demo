import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment credentials for optional Supabase Storage integration
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY;

export const supabase: SupabaseClient | null = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      }
    })
  : null;

export function isSupabaseConfigured(): boolean {
  return Boolean(supabaseUrl && supabaseAnonKey && supabase);
}

export interface PhotoUploadResult {
  status: string;
  photo_url: string;
  storage_path: string;
  filename: string;
  size_bytes: number;
}

/**
 * Upload a candidate passport photograph to Supabase Storage:
 * Structure: candidate-photos/{authenticated_user_id}/{unique_filename}.ext
 * Uses private bucket with signed URLs for secure candidate & admin viewing.
 */
export async function uploadToSupabaseStorage(
  userId: string,
  file: File
): Promise<PhotoUploadResult> {
  if (!supabase) {
    throw new Error('Supabase client is not configured.');
  }

  // 1. Validate file extension and MIME type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg'];
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  if (!allowedTypes.includes(file.type.toLowerCase()) && !['jpg', 'jpeg', 'png'].includes(ext)) {
    throw new Error('Invalid image format. Only JPG, JPEG, and PNG files are accepted.');
  }

  // 2. Validate max size (2MB)
  const maxSize = 2 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('File size exceeds the 2MB limit. Please upload a smaller passport-size photo.');
  }

  // 3. Unique filename and structured folder path
  const randomSuffix = Math.random().toString(36).substring(2, 10);
  const uniqueFilename = `photo_${Date.now()}_${randomSuffix}.${ext}`;
  const storagePath = `candidate-photos/${userId}/${uniqueFilename}`;

  // 4. Upload to private 'candidate-photos' bucket
  const { data, error } = await supabase.storage
    .from('candidate-photos')
    .upload(`${userId}/${uniqueFilename}`, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type || 'image/jpeg',
    });

  if (error) {
    console.error('Supabase storage upload error:', error);
    throw new Error(error.message || 'Failed to upload photo to Supabase storage.');
  }

  // 5. Generate secure 1-hour signed URL for private preview
  const { data: signedData, error: signError } = await supabase.storage
    .from('candidate-photos')
    .createSignedUrl(`${userId}/${uniqueFilename}`, 3600);

  if (signError) {
    console.warn('Could not generate signed URL:', signError);
  }

  const previewUrl = signedData?.signedUrl || '';

  return {
    status: 'success',
    photo_url: previewUrl,
    storage_path: storagePath,
    filename: uniqueFilename,
    size_bytes: file.size,
  };
}

/**
 * Generate signed URL for a private photo stored in Supabase
 */
export async function getCandidatePhotoSignedUrl(storagePath: string): Promise<string | null> {
  if (!supabase || !storagePath) return null;
  try {
    const cleanPath = storagePath.startsWith('candidate-photos/') 
      ? storagePath.replace('candidate-photos/', '') 
      : storagePath;

    const { data, error } = await supabase.storage
      .from('candidate-photos')
      .createSignedUrl(cleanPath, 3600);

    if (error || !data) return null;
    return data.signedUrl;
  } catch {
    return null;
  }
}
