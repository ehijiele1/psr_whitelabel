// Unified client factory - use these for all new code
export { 
  createSupabaseClient, 
  createClient, 
  createAdminClient, 
  createBrowserClient, 
  createAdminServerClient 
} from './clientFactory';

// Middleware
export { updateSession } from './middleware';

// Queries
export * from './queries';

// Invitations
export {
  getInvitationByToken,
  claimInvitation,
  createInvitation,
  resendInvitation,
  redeemInvitation,
  acceptInvitation,
} from './invitations';

// Legacy exports (deprecated - use clientFactory instead)
// These are kept for backward compatibility but should not be used in new code
export { createClient as legacyCreateServerClient } from './browser';
export { createAdminClient as legacyCreateAdminClient } from './server';
export { createAdminServerClient as legacyCreateAdminServerClient } from './server-admin';
