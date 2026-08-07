import { env } from '@/env.mjs';
import { auth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import { type NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const FILE_EXT_RE = /\.\w+$/;

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;

  if (!file) {
    return NextResponse.json({ error: 'Missing file' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const optimized = await sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toBuffer();

  const fileName = file.name.replace(FILE_EXT_RE, '.webp');
  const path = `bento-images/${session.user.id}/${crypto.randomUUID()}-${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, optimized, { contentType: 'image/webp', upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrl });
}
