// ── Core Roles ─────────────────────────────────────────────────
export type Role = 'landlord' | 'caretaker' | 'tenant' | 'applicant';

// ── Profiles ────────────────────────────────────────────────────
export interface Profile {
  id: string;
  user_id: string;
  role: Role;
  full_name: string;
  phone: string;
  avatar_url?: string;
  created_at: string;
}

// ── Units ───────────────────────────────────────────────────────
export type UnitType = 'apartment' | 'shop' | 'stall';

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  occupied: boolean;
  property_id: string;
  created_at: string;
}

// ── Tenants ─────────────────────────────────────────────────────
export type TenantStatus = 'active' | 'vacated' | 'pending';
export type PayFrequency = 'annual' | 'bi-annual' | 'quarterly' | 'monthly';

export interface Tenant {
  id: string;
  user_id?: string;
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  sex?: string;
  state_of_origin?: string;
  tribe?: string;
  lga?: string;
  home_address?: string;
  nationality?: string;
  religion?: string;
  reason_moving?: string;
  occupation?: string;
  employer?: string;
  employer_address?: string;
  employer_duration?: string;
  job_title?: string;
  office_phone?: string;
  guarantor?: string;
  guarantor_address?: string;
  guarantor_phone?: string;
  guarantor_occupation?: string;
  nin?: string;                  // Landlord-only visible
  unit: string;
  unit_id: string;
  type: UnitType;
  lease_start: string;
  lease_end: string;
  rent: number;
  security_deposit?: number;
  pay_freq: PayFrequency;
  status: TenantStatus;
  photo?: string;
  created_at: string;
}

// ── Applicants ──────────────────────────────────────────────────
export type ApplicantStage =
  | 'form-submitted'
  | 'payment-pending'
  | 'payment-proof-submitted'
  | 'payment-confirmed'
  | 'agreement-pending'
  | 'agreement-signed'
  | 'pending-review'
  | 'approved'
  | 'rejected';

export interface Applicant {
  id: string;
  // Personal
  name: string;
  phone: string;
  phone2?: string;
  email?: string;
  sex?: string;
  state_of_origin?: string;
  tribe?: string;
  lga?: string;
  home_address?: string;
  nationality?: string;
  religion?: string;
  reason_moving?: string;
  // Employment
  occupation?: string;
  employer?: string;
  employer_address?: string;
  employer_duration?: string;
  job_title?: string;
  office_phone?: string;
  // Guarantor
  guarantor?: string;
  guarantor_address?: string;
  guarantor_phone?: string;
  guarantor_occupation?: string;
  // Identity
  nin?: string;
  photo?: string;
  // Preferences
  unit_type: UnitType;
  move_in?: string;
  // Payment
  payment_status: 'unpaid' | 'proof-submitted' | 'paid';
  payment_amount?: number;
  payment_date?: string;
  payment_ref?: string;
  payment_method?: 'paystack' | 'bank transfer';
  depositor_name?: string;
  proof_image?: string;
  // Agreement
  signature_data?: string;
  signature_type?: 'draw' | 'type' | 'upload';
  agreed_on?: string;
  unit_assigned?: string;
  // Meta
  stage: ApplicantStage;
  submitted_at: string;
  reviewed_at?: string;
  rejection_reason?: string;
}

// ── Payments ────────────────────────────────────────────────────
export type PaymentType = 'rent' | 'levy';
export type PaymentMethod = 'cash' | 'bank transfer' | 'paystack';
export type PaymentStatus = 'pending' | 'approved' | 'rejected';

export interface LevyBreakdown {
  LAWMA?: number;
  LUC?: number;
  Sanitation?: number;
}

export interface Payment {
  id: string;
  tenant_id: string;
  tenant_name: string;
  unit: string;
  type: PaymentType;
  amount: number;
  method: PaymentMethod;
  date: string;
  period?: string;
  receipt_no: string;
  status: PaymentStatus;
  is_partial: boolean;
  partial_of?: number;
  levy_breakdown?: LevyBreakdown;
  paystack_ref?: string;
  created_at: string;
}

// ── Tickets ─────────────────────────────────────────────────────
export type TicketStatus = 'pending' | 'in-progress' | 'resolved';
export type TicketCategory = 'Plumbing' | 'Electrical' | 'LAWMA Waste' | 'Security' | 'Structural' | 'Other';
export type TicketPriority = 'low' | 'medium' | 'high';

export interface Ticket {
  id: string;
  tenant_id: string;
  tenant_name: string;
  unit: string;
  title: string;
  description?: string;
  category: TicketCategory;
  status: TicketStatus;
  priority: TicketPriority;
  notes?: string;
  resolved_by?: string;
  created_at: string;
  updated_at: string;
}

// ── Inbox ────────────────────────────────────────────────────────
export type InboxType = 'application' | 'message' | 'proof' | 'agreement';

export interface InboxMessage {
  id: string;
  type: InboxType;
  from: string;
  subject: string;
  preview: string;
  read: boolean;
  applicant_id?: string;
  tenant_id?: string;
  created_at: string;
}

// ── Activity ─────────────────────────────────────────────────────
export interface ActivityItem {
  id: string;
  icon: string;
  color: string;
  icon_color: string;
  text: string;
  time: string;
}

// ── Tenancy Agreements ─────────────────────────────────────────
export interface Agreement {
  id: string;
  tenant_id: string;
  applicant_id?: string;
  property_id?: string;
  unsigned_url?: string;
  signed_url?: string;
  signature_data?: string;
  signature_type?: 'draw' | 'type' | 'upload';
  signed_at?: string;
  lease_start?: string;
  lease_end?: string;
  rent_amount?: number;
  security_deposit?: number;
  status?: 'pending_signature' | 'signed' | 'active' | 'expired';
  created_at: string;
  updated_at?: string;
}

// ── Notices ────────────────────────────────────────────────────
export interface Notice {
  id: string;
  title: string;
  content: string;
  sender_id: string;
  sender_name: string;
  recipient_id: string | 'ALL';
  sent_at: string;
  read_by: string[];
  type: 'General' | 'Renewal' | 'Default' | 'Maintenance';
}

// ── Invitations ────────────────────────────────────────────────
export interface Invitation {
  id: string;
  user_id?: string;
  phone: string;
  email?: string;
  full_name?: string;
  unit_id?: string;
  property_id?: string;
  role: 'tenant';
  status: 'pending' | 'accepted' | 'expired';
  token: string;
  sent_at: string;
  accepted_at?: string;
  expires_at: string;
}

// ── Notifications ──────────────────────────────────────────────
export interface AppNotification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: 'REG_PENDING' | 'PAY_SUBMITTED' | 'LEASE_SIGNED' | 'GENERAL' | 'ADMIN_ALERT';
  link?: string;
  read: boolean;
  created_at: string;
}

// ── Bills ──────────────────────────────────────────────────────
export interface Bill {
  id: string;
  tenant_id: string;
  title: string;
  type: 'Rent' | 'Utility' | 'LUC';
  sub_type?: 'LAWMA' | 'Sanitation' | 'General';
  amount: number;
  amount_paid: number;
  due_date: string;
  status: 'Paid' | 'Pending' | 'Overdue' | 'Verifying' | 'Partially Paid';
  description: string;
  receipt_id?: string;
  created_at: string;
}

// ── Documents / File Storage ───────────────────────────────────
export interface FileDoc {
  id: string;
  name: string;
  folder_id?: string;
  size: string;
  type: string;
  created_at: string;
  url?: string;
  storage_path?: string;
  status?: 'Pending' | 'Approved' | 'Rejected';
  rejection_reason?: string;
  uploaded_by?: string;
  tenant_id?: string;
  applicant_id?: string;
}

// ── Settings ─────────────────────────────────────────────────────
export interface PropertySettings {
  property_name: string;
  landlord_name: string;
  address: string;
  emergency_phone: string;
  caretaker_name: string;
  caretaker_phone: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  email: string;
  landlord_pin: string;
  caretaker_pin: string;
  tenant_pin: string;
}

// ── Supabase DB Types ─────────────────────────────────────────────
export type Database = {
  public: {
    Tables: {
      profiles: { Row: Profile };
      properties: { Row: Property };
      tenants: { Row: Tenant };
      units: { Row: Unit };
      payments: { Row: Payment };
      tickets: { Row: Ticket };
      applicants: { Row: Applicant };
      inbox: { Row: InboxMessage };
      activity: { Row: ActivityItem };
      settings: { Row: PropertySettings };
      agreements: { Row: Agreement };
      notices: { Row: Notice };
      invitations: { Row: Invitation };
      files: { Row: FileDoc };
      bills: { Row: Bill };
      notifications: { Row: AppNotification };
      notification_preferences: { Row: NotificationPreference };
      audit_logs: { Row: AuditLogEntry };
      email_queue: { Row: EmailQueueItem };
    };
  };
};

export interface NotificationPreference {
  id: string;
  user_id: string;
  sms_enabled: boolean;
  email_enabled: boolean;
  in_app_enabled: boolean;
  rent_reminders: boolean;
  payment_alerts: boolean;
  ticket_updates: boolean;
  maintenance_alerts: boolean;
  broadcast_messages: boolean;
  created_at: string;
  updated_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_id?: string;
  property_id?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface EmailQueueItem {
  id: string;
  to_address: string;
  subject: string;
  html_body?: string;
  text_body?: string;
  status: 'pending' | 'sent' | 'failed';
  retry_count: number;
  error?: string;
  created_at: string;
  sent_at?: string;
}
