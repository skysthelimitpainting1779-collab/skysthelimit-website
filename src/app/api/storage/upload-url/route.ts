import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { createRateLimiter, jsonOk, jsonError } from '@/lib/api/utils';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.heic'];
const MAX_FILENAME_LENGTH = 128;

const rateLimit = createRateLimiter(10, 60 * 1000);

function sanitizeFileName(raw: string): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_FILENAME_LENGTH) {
    return null;
  }
  const basename = path.basename(raw);
  if (basename !== raw || basename.startsWith('.')) {
    return null;
  }
  const ext = path.extname(basename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return null;
  }
  if (/[^a-zA-Z0-9._\-]/.test(basename)) {
    return null;
  }
  return basename;
}

export async function POST(req: NextRequest) {
  const ip = (req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown').split(',')[0].trim();
  if (!rateLimit(ip)) {
    return jsonError('Too many requests. Please try again later.', 429);
  }

  if (!supabaseUrl || !supabaseServiceKey) {
    return jsonError('Storage is not configured.', 500);
  }

  try {
    const body = await req.json();
    const fileName = sanitizeFileName(body?.fileName);
    if (!fileName) {
      return jsonError('Invalid file name. Use alphanumeric characters with a supported image extension (.jpg, .jpeg, .png, .webp, .heic).', 400);
    }

    const uniqueName = `${Date.now()}-${fileName}`;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const bucketName = 'lead-photos';

    const { data, error } = await supabase.storage
      .from(bucketName)
      .createSignedUploadUrl(uniqueName);

    if (error) {
      return jsonError('Failed to generate upload URL.', 500);
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${uniqueName}`;

    return jsonOk({
      uploadUrl: data.signedUrl,
      publicUrl
    });
  } catch (err) {
    console.error('Storage upload URL generation failed:', err);
    return jsonError('Storage upload URL generation failed.', 500);
  }
}
