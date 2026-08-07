import { env } from '@/env.mjs';
import { auth } from '@/lib/auth';
import { redis } from '@/lib/redis';
import { supabase } from '@/lib/supabase';
import { db, eq } from '@/server/db';
import { link } from '@/server/db/schema';
import { type NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

const FILE_EXT_RE = /\.\w+$/;

function storagePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${env.SUPABASE_STORAGE_BUCKET}/`;
  const index = url.indexOf(marker);
  return index === -1 ? null : url.slice(index + marker.length);
}

export async function POST(request: NextRequest) {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get('file') as File;
  const profileLinkId = formData.get('profileLinkId') as string;

  if (!file || !profileLinkId) {
    return NextResponse.json(
      { error: 'Missing file or profileLinkId' },
      { status: 400 }
    );
  }

  const profileLink = await db.query.link.findFirst({
    where: (l, { eq }) => eq(l.id, profileLinkId),
    columns: { image: true, userId: true },
  });

  if (!profileLink || profileLink.userId !== session.user.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  if (profileLink.image) {
    const oldPath = storagePathFromPublicUrl(profileLink.image);
    if (oldPath) {
      await supabase.storage
        .from(env.SUPABASE_STORAGE_BUCKET)
        .remove([oldPath]);
    }
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const optimized = await sharp(buffer)
    .resize(400, 400, { fit: 'cover' })
    .webp({ quality: 85 })
    .toBuffer();

  const fileName = file.name.replace(FILE_EXT_RE, '.webp');
  const path = `avatars/${profileLinkId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(env.SUPABASE_STORAGE_BUCKET)
    .upload(path, optimized, { contentType: 'image/webp', upsert: true });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from(env.SUPABASE_STORAGE_BUCKET).getPublicUrl(path);

  const [updated] = await db
    .update(link)
    .set({ image: publicUrl })
    .where(eq(link.id, profileLinkId))
    .returning();

  if (updated?.link) {
    await redis.set(`profile-link:${updated.link}`, updated, {
      ex: 30 * 60,
    });
  }

  return NextResponse.json({ url: publicUrl });
}
