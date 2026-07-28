import {
  sendEmail,
  notifyApplicationReceived,
  notifyApplicationApproved,
  notifyApplicationRejected,
  notifyLeaseReady,
  notifyLeaseFinalized,
  notifyPaymentReceived,
  notifyRentReminder,
  notifyTicketUpdate,
} from './email';

export {
  sendEmail,
  notifyApplicationReceived,
  notifyApplicationApproved,
  notifyApplicationRejected,
  notifyLeaseReady,
  notifyLeaseFinalized,
  notifyPaymentReceived,
  notifyRentReminder,
  notifyTicketUpdate,
};

export const emails = {
  applicationReceived: notifyApplicationReceived,
  applicationApproved: notifyApplicationApproved,
  applicationRejected: notifyApplicationRejected,
  leaseReady: notifyLeaseReady,
  leaseFinalized: notifyLeaseFinalized,
  paymentReceived: notifyPaymentReceived,
  rentReminder: notifyRentReminder,
  ticketUpdate: notifyTicketUpdate,
};
