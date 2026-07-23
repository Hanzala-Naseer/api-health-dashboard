import axios from 'axios';

/**
 * Base URL for the real backend (see api_health_dashboard_backend_ui):
 *   app.use('/api/auth', authRoutes)
 *   app.use('/api/endpoints', endpointRoutes)
 * There is no `/v1` prefix on this backend — do not add one.
 */
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

const ACCESS_TOKEN_KEY = 'apihealth_access_token';

export function getAccessToken() {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token) {
  if (token) localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
}

const apiClient = axios.create({
  baseURL: BASE_URL,
  // The backend also issues httpOnly cookies (access + refresh) alongside
  // the bearer token in the body. Sending credentials lets the cookie path
  // work too, with the Authorization header as a same-origin-independent
  // fallback for the access token.
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Request interceptor: attach bearer token ---
apiClient.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// --- Response interceptor: transparent refresh-token retry on 401 ---
let isRefreshing = false;
let pendingQueue = [];

function resolveQueue(error) {
  pendingQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve();
  });
  pendingQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const isAuthEndpoint =
      originalRequest?.url?.includes('/auth/login') ||
      originalRequest?.url?.includes('/auth/refresh-token');

    if (status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      if (isRefreshing) {
        // Queue this request until the in-flight refresh resolves.
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => apiClient(originalRequest));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await apiClient.post('/auth/refresh-token');
        setAccessToken(data?.data?.accessToken);
        resolveQueue(null);
        return apiClient(originalRequest);
      } catch (refreshError) {
        resolveQueue(refreshError);
        clearAccessToken();
        window.dispatchEvent(new CustomEvent('auth:logout'));
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

/** Pull a human-readable message out of the backend's standard error envelope. */
export function getErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  return error?.response?.data?.message || error?.message || fallback;
}

export default apiClient;
