import { z } from 'zod';

// ── Common Schemas ────────────────────────────────────────────────────────

export const emailSchema = z.string().email('Invalid email format');
export const phoneSchema = z.string().min(10, 'Phone must be at least 10 characters').max(15, 'Phone must be at most 15 characters');
export const passwordSchema = z.string().min(8, 'Password must be at least 8 characters');
export const idSchema = z.string().uuid('Invalid ID format');
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');
export const amountSchema = z.number().positive('Amount must be a positive number');
export const positiveIntSchema = z.number().int().positive('Must be a positive integer');

// ── User/Profile Schemas ──────────────────────────────────────────────────

export const createUserSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: phoneSchema.optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').optional(),
  phone: phoneSchema.optional(),
  email: emailSchema.optional(),
});

export const staffCreateSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  full_name: z.string().min(2, 'Full name must be at least 2 characters'),
  phone: phoneSchema.optional(),
  role: z.enum(['caretaker', 'tenant']).default('caretaker'),
});

// ── Authentication Schemas ───────────────────────────────────────────────

export const loginSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  newPassword: passwordSchema,
});

// ── Property Schemas ──────────────────────────────────────────────────────

export const propertySchema = z.object({
  name: z.string().min(2, 'Property name must be at least 2 characters'),
  address: z.string().min(5, 'Address must be at least 5 characters'),
  type: z.enum(['Residential', 'Commercial', 'Mixed', 'Other']),
  status: z.enum(['active', 'inactive', 'maintenance']).default('active'),
  rent_collection: z.enum(['automatic', 'manual']).default('automatic'),
});

// ── Unit Schemas ──────────────────────────────────────────────────────────

export const unitSchema = z.object({
  name: z.string().min(1, 'Unit name is required'),
  property_id: idSchema,
  type: z.string().min(1, 'Unit type is required'),
  rent_amount: amountSchema.optional(),
  status: z.enum(['vacant', 'occupied', 'maintenance']).default('vacant'),
});

// ── Tenant Schemas ────────────────────────────────────────────────────────

export const tenantSchema = z.object({
  name: z.string().min(2, 'Tenant name must be at least 2 characters'),
  email: emailSchema.optional(),
  phone: phoneSchema,
  unit_id: idSchema,
  property_id: idSchema,
  type: z.enum(['individual', 'corporate']).default('individual'),
  lease_start: dateSchema.optional(),
  lease_end: dateSchema.optional(),
  rent_amount: amountSchema.optional(),
  deposit_amount: amountSchema.optional(),
  status: z.enum(['active', 'inactive', 'evicted']).default('active'),
});

// ── Payment Schemas ──────────────────────────────────────────────────────

export const paymentSchema = z.object({
  tenant_id: idSchema,
  property_id: idSchema,
  tenant_name: z.string().min(2, 'Tenant name is required'),
  unit: z.string().min(1, 'Unit is required'),
  type: z.enum(['rent', 'levy', 'deposit', 'other']),
  amount: amountSchema,
  method: z.enum(['cash', 'bank transfer', 'paystack', 'other']),
  date: dateSchema,
  period: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected', 'overdue']).default('approved'),
  is_partial: z.boolean().default(false),
  notes: z.string().max(500, 'Notes must be at most 500 characters').optional(),
});

// Schema for bulk payment import
const importRowSchema = z.object({
  tenant_name: z.string().min(2, 'Tenant name is required'),
  unit: z.string().min(1, 'Unit is required'),
  type: z.enum(['rent', 'levy']),
  amount: amountSchema,
  method: z.enum(['cash', 'bank transfer', 'paystack']),
  date: dateSchema,
  period: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']).optional(),
  is_partial: z.boolean().optional(),
  notes: z.string().max(500).optional(),
});

export const paymentsImportSchema = z.object({
  records: z.array(importRowSchema).min(1, 'At least one record is required').max(100, 'Maximum 100 records per import'),
});

// ── File Upload Schemas ──────────────────────────────────────────────────

export const fileUploadSchema = z.object({
  file: z.instanceof(File, { message: 'File is required' }),
  bucket: z.enum(['documents', 'photos', 'agreements']),
  folder: z.string().max(200, 'Folder path too long').optional(),
});

// ── Ticket Schemas ────────────────────────────────────────────────────────

export const ticketSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  category: z.enum(['maintenance', 'complaint', 'question', 'other']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  property_id: idSchema,
  unit_id: idSchema.optional(),
});

export const ticketUpdateSchema = z.object({
  status: z.enum(['pending', 'in-progress', 'resolved']),
});

// ── Subscription Schemas ────────────────────────────────────────────────

export const subscriptionPlanSchema = z.object({
  property_id: idSchema,
  name: z.string().min(2, 'Plan name is required'),
  amount: amountSchema,
  interval: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'annually']),
});

export const subscriptionManageSchema = z.object({
  action: z.enum(['subscribe', 'cancel', 'enable', 'disable']),
  plan_id: idSchema.optional(),
  tenant_id: idSchema.optional(),
  subscription_id: idSchema.optional(),
});

// ── Push Notification Schemas ────────────────────────────────────────────

export const pushSubscribeSchema = z.object({
  subscription: z.object({
    endpoint: z.string().url('Invalid endpoint URL'),
    keys: z.object({
      p256dh: z.string().min(1, 'p256dh key is required'),
      auth: z.string().min(1, 'auth key is required'),
    }),
  }),
});

export const pushSendSchema = z.object({
  title: z.string().min(2, 'Title is required'),
  body: z.string().min(2, 'Body is required'),
  data: z.record(z.unknown()).optional(),
  userId: idSchema.optional(),
});

// ── Email Schemas ─────────────────────────────────────────────────────────

export const emailSendSchema = z.object({
  to: emailSchema,
  subject: z.string().min(2, 'Subject is required'),
  html: z.string().optional(),
  text: z.string().optional(),
}).refine((data) => data.html || data.text, {
  message: 'Either html or text body is required',
});

// ── Invitation Schemas ───────────────────────────────────────────────────

export const invitationSchema = z.object({
  phone: phoneSchema,
  email: emailSchema.optional(),
  full_name: z.string().min(2, 'Full name is required').optional(),
  role: z.enum(['tenant', 'caretaker']).optional(),
  unit_id: idSchema.optional(),
  property_id: idSchema.optional(),
  payment_history: z.array(z.unknown()).optional(),
  notes: z.string().max(500).optional(),
});

// ── Setup Schemas ─────────────────────────────────────────────────────────

export const setupSchema = z.object({
  account: z.object({
    email: emailSchema,
    password: passwordSchema,
    fullName: z.string().min(2, 'Full name is required'),
    phone: phoneSchema.optional(),
  }),
  property: z.object({
    name: z.string().min(2, 'Property name is required'),
    address: z.string().min(5, 'Address is required'),
    type: z.enum(['Residential', 'Commercial', 'Mixed', 'Other']).optional(),
    rentCollection: z.enum(['automatic', 'manual']).optional(),
  }),
  unitGroups: z.array(
    z.object({
      type: z.enum(['apartment', 'shop', 'stall']).optional(),
      label: z.string().optional(),
      quantity: z.string().optional(),
      defaultRent: z.string().optional(),
      defaultDeposit: z.string().optional(),
      lawma: z.string().optional(),
      sanitation: z.string().optional(),
      units: z.array(
        z.object({
          name: z.string().min(1, 'Unit name is required'),
          monthlyRent: z.string().optional(),
          deposit: z.string().optional(),
          luc: z.string().optional(),
        })
      ).optional(),
    })
  ).optional(),
});

// ── Onboarding/Application Schemas ────────────────────────────────────────

export const applicationSchema = z.object({
  fullName: z.string().min(2, 'Full name is required'),
  email: emailSchema,
  phone: phoneSchema,
  address: z.string().min(5, 'Address is required'),
  occupation: z.string().min(2, 'Occupation is required'),
  nextOfKin: z.string().min(2, 'Next of kin is required'),
  nextOfKinPhone: phoneSchema,
  emergencyContact: z.string().min(2, 'Emergency contact is required'),
  emergencyContactPhone: phoneSchema,
  propertyId: idSchema,
  unitId: idSchema,
  moveInDate: dateSchema,
  leaseDuration: z.enum(['6 months', '1 year', '2 years', 'other']).optional(),
  paymentFrequency: z.enum(['monthly', 'quarterly', 'annually']).optional(),
  specialRequests: z.string().max(500).optional(),
});

// ── Helper Functions ──────────────────────────────────────────────────────

/**
 * Validate data against a Zod schema and return parsed data or error
 */
export function validateSchema<T>(schema: z.ZodSchema<T>, data: unknown): { success: boolean; data?: T; error?: string } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  } else {
    // Format the first error with its field path so users know which field failed
    const issue = result.error.errors[0];
    const fieldPath = issue.path.length > 0 ? issue.path.join('.') + ': ' : '';
    const errorMessage = issue.message || 'Validation failed';
    return { success: false, error: fieldPath + errorMessage };
  }
}

/**
 * Validate and parse form data (for multipart/form-data)
 */
export async function validateFormData<T>(
  schema: z.ZodSchema<T>,
  formData: FormData
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const data: Record<string, unknown> = {};
    
    for (const [key, value] of formData.entries()) {
      if (value instanceof File) {
        data[key] = value;
      } else if (value === 'true' || value === 'false') {
        data[key] = value === 'true';
      } else if (!isNaN(Number(value))) {
        data[key] = Number(value);
      } else {
        data[key] = value;
      }
    }

    return validateSchema(schema, data);
  } catch {
    return { success: false, error: 'Invalid form data' };
  }
}

/**
 * Create a validation middleware for API routes
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
  return async (req: Request): Promise<{ success: boolean; data?: T; error?: string }> => {
    try {
      const body = await req.json();
      return validateSchema(schema, body);
    } catch {
      return { success: false, error: 'Invalid JSON body' };
    }
  };
}
