export function getEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    if (process.env.NODE_ENV === 'production') {
      console.warn(`[Env] Missing environment variable: ${key}`);
    }
    return '';
  }
  return value;
}

export function isDev(): boolean {
  return process.env.NODE_ENV === 'development';
}

export function isProd(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function getPublicEnv(key: string): string {
  const NEXT_PUBLIC_PREFIX = 'NEXT_PUBLIC_';
  if (!key.startsWith(NEXT_PUBLIC_PREFIX)) {
    console.warn(`[Env] ${key} is not a public environment variable (must start with ${NEXT_PUBLIC_PREFIX})`);
  }
  return getEnv(key);
}

export const env = {
  appUrl: getEnv('NEXT_PUBLIC_APP_URL') || 'http://localhost:3000',
  supabaseUrl: getEnv('NEXT_PUBLIC_SUPABASE_URL'),
  supabaseAnonKey: getEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
  supabaseServiceRoleKey: getEnv('SUPABASE_SERVICE_ROLE_KEY'),
  paystackPublicKey: getEnv('NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY'),
  paystackSecretKey: getEnv('PAYSTACK_SECRET_KEY'),
  vapidPublicKey: getEnv('NEXT_PUBLIC_VAPID_PUBLIC_KEY'),
  vapidPrivateKey: getEnv('VAPID_PRIVATE_KEY'),
  ebulkSmsUsername: getEnv('EBULK_SMS_USERNAME'),
  ebulkSmsApiKey: getEnv('EBULK_SMS_API_KEY'),
  smtpHost: getEnv('SMTP_HOST'),
  smtpPort: getEnv('SMTP_PORT'),
  smtpUser: getEnv('SMTP_USER'),
  smtpPass: getEnv('SMTP_PASS'),
  smtpFrom: getEnv('SMTP_FROM'),
};

export function validateRequiredEnv(): string[] {
  const missing: string[] = [];
  const required = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY',
    'NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY',
    'PAYSTACK_SECRET_KEY',
  ];

  for (const key of required) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  return missing;
}