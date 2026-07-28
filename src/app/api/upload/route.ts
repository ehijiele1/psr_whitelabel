import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from '@/lib/auth/require-role';
import { csrfProtection } from '@/lib/csrf';
import { createClient } from '@/lib/supabase/clientFactory';
import { fileUploadSchema, validateFormData } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  // Apply CSRF protection
  const csrfResult = await csrfProtection(req);
  if (!csrfResult.valid) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid CSRF token' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const auth = await requireRole(['landlord', 'caretaker', 'tenant', 'applicant']);
    if (!auth.ok) return auth.response;

    const formData = await req.formData();
    
    // Validate form data using Zod schema
    const validation = await validateFormData(fileUploadSchema, formData);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid form data' }, { status: 400 });
    }

    const { file, bucket, folder } = validation.data;

    // Role-based bucket access control
    if (auth.user.role === 'tenant') {
      // Tenants can only upload to their own folders in documents
      if (bucket !== 'documents') {
        return NextResponse.json({ error: 'Unauthorized bucket access' }, { status: 403 });
      }
    } else if (auth.user.role === 'caretaker') {
      // Caretakers can upload to documents and photos
      if (bucket === 'agreements') {
        return NextResponse.json({ error: 'Unauthorized bucket access' }, { status: 403 });
      }
    }
    // Landlords can upload to all buckets

    // Additional validation (file type and size are already validated by Zod)
    const allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedMimes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type: ${file.type}. Allowed: ${allowedMimes.join(', ')}` },
        { status: 400 }
      );
    }

    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large. Max 10MB.' }, { status: 400 });
    }

    // Use regular client with RLS (not admin client)
    const supabase = await createClient();

    const timestamp = Date.now();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
    const safeFolder = folder ? folder.replace(/[^a-zA-Z0-9/_-]/g, '').replace(/\.{2,}/g, '').replace(/^\/+|\/+$/g, '') : '';
    const filePath = safeFolder ? `${safeFolder}/${timestamp}-${safeName}` : `${timestamp}-${safeName}`;

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

    // Insert file metadata with ownership
    const { error: dbError } = await supabase.from('files').insert({
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      storage_path: uploadData.path,
      storage_bucket: bucket,
      is_base64: false,
      uploaded_by: auth.user.id,
    });

    if (dbError) {
      // If DB insert fails, try to clean up the uploaded file
      await supabase.storage.from(bucket).remove([uploadData.path]);
      return NextResponse.json({ error: dbError.message }, { status: 500 });
    }

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