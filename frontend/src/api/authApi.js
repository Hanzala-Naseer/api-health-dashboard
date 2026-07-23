import apiClient from './client';

/**
 * Auth API — every function here maps to a REAL backend route
 * (see src/modules/auth/auth.routes.js in the backend). Nothing here is
 * a placeholder.
 */

export async function registerUser({ firstName, lastName, email, password, phoneNumber }) {
  const payload = { firstName, lastName, email, password };
  if (phoneNumber) payload.phoneNumber = phoneNumber;
  const { data } = await apiClient.post('/auth/register', payload);
  return data.data; // { user }
}

export async function verifyOtp({ email, otp, purpose = 'REGISTRATION' }) {
  const { data } = await apiClient.post('/auth/verify-otp', { email, otp, purpose });
  return data.data; // { user }
}

export async function resendOtp({ email, purpose = 'REGISTRATION' }) {
  const { data } = await apiClient.post('/auth/resend-otp', { email, purpose });
  return data; // { message }
}

export async function loginUser({ email, password, rememberMe = false }) {
  const { data } = await apiClient.post('/auth/login', { email, password, rememberMe });
  return data.data; // { user, accessToken, accessExpiresAt }
}

export async function getCurrentUser() {
  const { data } = await apiClient.get('/auth/me');
  return data.data.user; // { id, email, role, status } — no name fields
}

export async function refreshAccessToken() {
  const { data } = await apiClient.post('/auth/refresh-token');
  return data.data; // { accessToken, accessExpiresAt }
}

export async function logoutUser() {
  const { data } = await apiClient.post('/auth/logout');
  return data;
}

export async function logoutAllDevices() {
  const { data } = await apiClient.post('/auth/logout-all');
  return data;
}

export async function forgotPassword({ email }) {
  const { data } = await apiClient.post('/auth/forgot-password', { email });
  return data; // { message }
}

export async function resetPassword({ token, newPassword }) {
  const { data } = await apiClient.post('/auth/reset-password', { token, newPassword });
  return data; // { message }
}

export async function changePassword({ currentPassword, newPassword }) {
  const { data } = await apiClient.post('/auth/change-password', { currentPassword, newPassword });
  return data; // { message }
}
