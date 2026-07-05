import { createBrowserClient } from './browser';

export async function createProperty(data: {
  name: string
  address: string
  description?: string
  emergency_contact?: string
  caretaker_contact?: string
}) {
  const supabase = createBrowserClient();
  const { data: user } = await supabase.auth.getUser();
  if (!user.user) return { error: 'Not authenticated' };

  const { error } = await supabase.from('properties').insert({
    ...data,
    landlord_id: user.user.id,
    status: 'active',
  });
  return { error };
}

export async function updateProperty(id: string, data: {
  name?: string
  address?: string
  description?: string
  status?: string
  emergency_contact?: string
  caretaker_contact?: string
}) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('properties').update(data).eq('id', id);
  return { error };
}

export async function deleteProperty(id: string) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('properties').delete().eq('id', id);
  return { error };
}

export async function createUnit(data: {
  property_id: string
  name: string
  type: "apartment" | "stall" | "shop"
  monthly_rent: number
  deposit_amount?: number
  description?: string
}) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('units').insert({
    ...data,
    status: 'available',
  });
  return { error };
}

export async function updateUnit(id: string, data: {
  name?: string
  type?: "apartment" | "stall" | "shop"
  status?: "available" | "occupied" | "maintenance" | "unavailable"
  monthly_rent?: number
  deposit_amount?: number
  description?: string
}) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('units').update(data).eq('id', id);
  return { error };
}

export async function deleteUnit(id: string) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('units').delete().eq('id', id);
  return { error };
}

export async function createTenant(data: {
  user_id: string
  unit_id: string
  property_id: string
  tenancy_start: string
  tenancy_end: string
  rent_amount: number
  notes?: string
}) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('tenants').insert({
    ...data,
    status: 'active',
  });
  if (error) return { error };

  const { error: unitError } = await supabase
    .from('units')
    .update({ status: 'occupied' })
    .eq('id', data.unit_id);

  return { error: unitError };
}

export async function updateTenant(id: string, data: {
  tenancy_start?: string
  tenancy_end?: string
  rent_amount?: number
  status?: "active" | "expired" | "terminated" | "pending"
  notes?: string
}) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('tenants').update(data).eq('id', id);
  return { error };
}

export async function deleteTenant(id: string, unitId: string) {
  const supabase = createBrowserClient();
  const { error: tenantError } = await supabase.from('tenants').delete().eq('id', id);
  if (tenantError) return { error: tenantError };

  const { error: unitError } = await supabase
    .from('units')
    .update({ status: 'available' })
    .eq('id', unitId);

  return { error: unitError };
}

export async function recordPayment(data: {
  tenant_id: string
  property_id: string
  amount: number
  type: "rent" | "utility" | "combined"
  cycle_start: string
  cycle_end: string
  method: "paystack" | "offline"
  reference?: string
  notes?: string
}) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('payments').insert({
    ...data,
    status: 'pending',
  });
  return { error };
}

export async function approvePayment(id: string) {
  const supabase = createBrowserClient();
  const { data: user } = await supabase.auth.getUser();
  const { error } = await supabase
    .from('payments')
    .update({
      status: 'approved',
      approved_by: user.user?.id,
      approved_at: new Date().toISOString(),
    })
    .eq('id', id);
  return { error };
}

export async function rejectPayment(id: string) {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from('payments')
    .update({ status: 'rejected' })
    .eq('id', id);
  return { error };
}

export async function createTicket(data: {
  tenant_id: string
  unit_id: string
  property_id: string
  title: string
  description: string
  priority: "low" | "medium" | "high" | "urgent"
}) {
  const supabase = createBrowserClient();
  const { error } = await supabase.from('tickets').insert(data);
  return { error };
}

export async function updateTicketStatus(id: string, status: "open" | "in_progress" | "resolved" | "closed") {
  const supabase = createBrowserClient();
  const updateData: Record<string, unknown> = { status };
  if (status === "resolved") {
    updateData.resolved_at = new Date().toISOString();
  }
  const { error } = await supabase.from('tickets').update(updateData).eq('id', id);
  return { error };
}

export async function assignTicket(ticketId: string, assignedTo: string) {
  const supabase = createBrowserClient();
  const { error } = await supabase
    .from('tickets')
    .update({ assigned_to: assignedTo, status: 'in_progress' })
    .eq('id', ticketId);
  return { error };
}