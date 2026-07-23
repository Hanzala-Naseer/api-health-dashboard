import { changePassword as changePasswordReal } from './authApi';

/**
 * Profile / Account Settings API
 *
 * Change password is a REAL backend route (delegated to authApi, which
 * calls POST /api/auth/change-password).
 *
 * TODO Replace with backend endpoint
 * Even in the latest backend build, there is still no route to update
 * profile fields (name, company, role, avatar), and no route exposing
 * NotificationSetting (the model exists at
 * src/models/NotificationSetting.model.js and notification.service.js
 * references it, but nothing mounts it over HTTP). Those remain
 * placeholders below.
 */

export const changePassword = changePasswordReal;

// TODO Replace with backend endpoint
export async function updateProfile(payload) {
  console.warn('[placeholder] updateProfile: no backend route exists to persist profile fields yet.');
  return Promise.resolve({ ...payload, __placeholder: true });
}

// TODO Replace with backend endpoint
export async function getNotificationPreferences() {
  return Promise.resolve({
    emailAlerts: true,
    alertOnRecovery: true,
    timezone: 'UTC',
    alertThreshold: 85,
    slackConnected: false,
    retentionPeriodDays: 30,
    __placeholder: true,
  });
}

// TODO Replace with backend endpoint
export async function updateNotificationPreferences(payload) {
  console.warn('[placeholder] updateNotificationPreferences: NotificationSetting has no route yet.');
  return Promise.resolve({ ...payload, __placeholder: true });
}
