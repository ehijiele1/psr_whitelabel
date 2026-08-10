import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/clientFactory';
import { requireRole } from '@/lib/auth/require-role';
import { csrfProtection } from '@/lib/csrf';
import { staffCreateSchema, validateSchema } from '@/lib/schemas';

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
    const auth = await requireRole(['landlord']);
    if (!auth.ok) return auth.response;

    const bodyData = await req.json();
    
    // Validate using Zod schema
    const validation = validateSchema(staffCreateSchema, bodyData);
    if (!validation.success || !validation.data) {
      return NextResponse.json({ error: validation.error || 'Invalid data' }, { status: 400 });
    }

    const { email, password, full_name, phone, role } = validation.data;

    // Use admin client to create the auth user with is_admin_created flag
    const { createAdminClient } = await import('@/lib/supabase/clientFactory');
    const admin = await createAdminClient();

    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name,
        phone,
        role,
        is_admin_created: true,
      },
    });

    if (createError || !createData.user?.id) {
      return NextResponse.json(
        { error: createError?.message || 'Failed to create account' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, user_id: createData.user.id });
  } catch (err) {
    console.error('[Staff Create] Error:', err);
    return NextResponse.json(
      { error: (err as Error).message || 'Creation failed' },
      { status: 500 }
    );
  }
}