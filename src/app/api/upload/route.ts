import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const bucket = (formData.get('bucket') as string) || 'documents';
    const folder = (formData.get('folder') as string) || '';

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const allowedBuckets = ['documents', 'receipts', 'agreements', 'avatars'];
    if (!allowedBuckets.includes(bucket)) {
      return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 });
    }

    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'bin';
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (bucket !== 'avatars' && !allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${allowedMimes.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    const { createAdminClient } = await import('@/lib/supabase/server');
    const supabase = await createAdminClient();

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const filePath = folder ? `${folder}/${timestamp}-${safeName}` : `${timestamp}-${safeName}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(uploadData.path);

    const { data: user } = await supabase.auth.getUser();
    await supabase.from('files').insert({
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: uploadData.path,
      storage_bucket: bucket,
      is_base64: false,
      uploaded_by: user?.user?.id || null,
    });

    return NextResponse.json({
      url: publicUrl,
      path: uploadData.path,
      name: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (err) {
    console.error('[Upload API] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Upload failed' },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};