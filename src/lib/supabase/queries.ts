import { createBrowserClient } from './browser';

export async function getUser() {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

export async function getProfile() {
  const supabase = createBrowserClient();
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function getUserRole(): Promise<string | null> {
  const supabase = createBrowserClient();
  const user = await getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  return data?.role || null;
}

export async function isAdminRole(role: string | null): Promise<boolean> {
  if (!role) return false;
  return ['landlord', 'caretaker'].includes(role);
}

export async function isTenantRole(role: string | null): Promise<boolean> {
  if (!role) return false;
  return ['tenant', 'applicant'].includes(role);
}

export async function getProperties() {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('properties')
    .select('*, units(count), tenants!inner(count)')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getProperty(id: string) {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('properties')
    .select('*, units(*), tenants(*, profiles(full_name, email, phone))')
    .eq('id', id)
    .single();

  return data;
}

export async function getTenants() {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('tenants')
    .select('*, profiles(full_name, email, phone), units(name, monthly_rent), properties(name)')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getTenant(id: string) {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('tenants')
    .select('*, profiles(full_name, email, phone), units(*), properties(*), payments(*), tickets(*)')
    .eq('id', id)
    .single();

  return data;
}

export async function getPayments() {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('payments')
    .select('*, tenants!inner(profiles(full_name), units(name))')
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getTenantPayments(tenantId: string) {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('payments')
    .select('*, tenants!inner(profiles(full_name), units(name))')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getTenantTickets(tenantId: string) {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('tickets')
    .select('*, units(name)')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  return data || [];
}

export async function getApplications() {
  const supabase = createBrowserClient();
  const { data } = await supabase
    .from('applications')
    .select('*, profiles(full_name, email, phone)')
    .order('submitted_at', { ascending: false });

  return data || [];
}

export async function submitApplication(
  formData: Record<string, unknown>
): Promise<{ success: boolean; error?: string }> {
  const supabase = createBrowserClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { success: false, error: 'Not authenticated' };

  const { error } = await supabase.from('applications').insert({
    user_id: user.id,
    form_data: formData,
    status: 'pending',
    submitted_at: new Date().toISOString(),
  });

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function getDashboardStats() {
  const supabase = createBrowserClient();
  const [properties, tenants, payments] = await Promise.all([
    supabase.from('properties').select('id', { count: 'exact', head: true }),
    supabase.from('tenants').select('id', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('payments').select('amount').eq('status', 'approved'),
  ]);

  const totalRevenue = (payments.data || []).reduce((sum: number, p: { amount: number }) => sum + (p.amount || 0), 0);

  return {
    totalProperties: properties.count || 0,
    activeTenants: tenants.count || 0,
    totalRevenue,
  };
}