const getEnvVar = (name) => {
  try {
    if (typeof import.meta !== 'undefined' && import.meta?.env?.[name]) {
      return import.meta.env[name];
    }
    if (typeof process !== 'undefined' && process?.env?.[name]) {
      return process.env[name];
    }
  } catch {
    // ignore
  }
  return undefined;
};

const API_BASE_URL = getEnvVar('VITE_API_URL') || '/api/v1';

// In-memory token storage (with safe fallback for Capacitor & Node.js test environments)
let memoryAccessToken = null;
let memoryRefreshToken = null;

const getSafeStorage = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage;
  }
  return null;
};

export const tokenStorage = {
  getAccessToken: () => {
    if (memoryAccessToken) return memoryAccessToken;
    const storage = getSafeStorage();
    return storage ? storage.getItem('mylawyer_access_token') : null;
  },
  setAccessToken: (token) => {
    memoryAccessToken = token;
    const storage = getSafeStorage();
    if (storage) {
      if (token) {
        storage.setItem('mylawyer_access_token', token);
      } else {
        storage.removeItem('mylawyer_access_token');
      }
    }
  },
  getRefreshToken: () => {
    if (memoryRefreshToken) return memoryRefreshToken;
    const storage = getSafeStorage();
    return storage ? storage.getItem('mylawyer_refresh_token') : null;
  },
  setRefreshToken: (token) => {
    memoryRefreshToken = token;
    const storage = getSafeStorage();
    if (storage) {
      if (token) {
        storage.setItem('mylawyer_refresh_token', token);
      } else {
        storage.removeItem('mylawyer_refresh_token');
      }
    }
  },
  clearTokens: () => {
    memoryAccessToken = null;
    memoryRefreshToken = null;
    const storage = getSafeStorage();
    if (storage) {
      storage.removeItem('mylawyer_access_token');
      storage.removeItem('mylawyer_refresh_token');
      storage.removeItem('mylawyer_user');
    }
  }
};

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

/**
 * Centralized fetch wrapper with automatic token refresh rotation
 */
export async function apiRequest(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  const headers = {
    'Accept': 'application/json',
    ...(options.headers || {})
  };

  // If not FormData, default to application/json
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const token = tokenStorage.getAccessToken();
  if (token && !headers['Authorization']) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    let response = await fetch(url, { ...options, headers });

    // Handle 401 Unauthorized -> try refresh token
    if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh')) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(newToken => {
          headers['Authorization'] = `Bearer ${newToken}`;
          return fetch(url, { ...options, headers }).then(res => res.json());
        });
      }

      isRefreshing = true;
      const refreshToken = tokenStorage.getRefreshToken();

      if (!refreshToken) {
        tokenStorage.clearTokens();
        isRefreshing = false;
        throw new Error('انتهت الجلسة، يرجى إعادة تسجيل الدخول');
      }

      try {
        const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken })
        });
        const refreshData = await refreshRes.json();

        if (!refreshRes.ok || !refreshData.success) {
          throw new Error('انتهت صلاحية الجلسة');
        }

        tokenStorage.setAccessToken(refreshData.data.accessToken);
        tokenStorage.setRefreshToken(refreshData.data.refreshToken);

        processQueue(null, refreshData.data.accessToken);

        headers['Authorization'] = `Bearer ${refreshData.data.accessToken}`;
        response = await fetch(url, { ...options, headers });
      } catch (refreshErr) {
        processQueue(refreshErr, null);
        tokenStorage.clearTokens();
        window.dispatchEvent(new CustomEvent('mylawyer:session-expired'));
        throw new Error('انتهت صلاحية الجلسة، يرجى تسجيل الدخول مجدداً');
      } finally {
        isRefreshing = false;
      }
    }

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg = data.error || data.message || `خطأ في الخادم (${response.status})`;
      const err = new Error(errorMsg);
      err.status = response.status;
      err.data = data;
      throw err;
    }

    return data;
  } catch (err) {
    if (err.name === 'TypeError' && err.message.includes('fetch')) {
      throw new Error('تعذر الاتصال بالخادم، يرجى التحقق من اتصال الإنترنت');
    }
    throw err;
  }
}

// API Service Methods
export const authApi = {
  register: (payload) => apiRequest('/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  verifyOtp: (email, otp) => apiRequest('/auth/verify-otp', {
    method: 'POST',
    body: JSON.stringify({ email, otp })
  }),

  resendOtp: (email) => apiRequest('/auth/resend-otp', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  login: (identifier, password, rememberMe = true) => apiRequest('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, password, rememberMe })
  }),

  logout: (refreshToken) => apiRequest('/auth/logout', {
    method: 'POST',
    body: JSON.stringify({ refreshToken })
  }),

  forgotPassword: (email) => apiRequest('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email })
  }),

  resetPassword: (payload) => apiRequest('/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify(payload)
  }),

  getCurrentUser: () => apiRequest('/users/me'),
};

export const lawyerApi = {
  getProfile: () => apiRequest('/lawyers/me'),

  getNearbyLawyers: ({ lat, lon, radiusKm = 50, specialty } = {}) => {
    const params = new URLSearchParams();
    if (lat !== undefined && lat !== null) params.append('lat', lat);
    if (lon !== undefined && lon !== null) params.append('lon', lon);
    if (radiusKm) params.append('radius_km', radiusKm);
    if (specialty) params.append('specialty', specialty);
    return apiRequest(`/lawyers/nearby?${params.toString()}`);
  },

  updateAvailability: (isAvailable) => apiRequest('/lawyers/me/availability', {
    method: 'POST',
    body: JSON.stringify({ isAvailable }),
  }),

  updateLocation: (latitude, longitude) => apiRequest('/lawyers/me/location', {
    method: 'POST',
    body: JSON.stringify({ latitude, longitude }),
  }),

  uploadProfilePhoto: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/lawyers/me/profile-photo', {
      method: 'POST',
      body: formData
    });
  },

  uploadSyndicateCard: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/lawyers/me/documents', {
      method: 'POST',
      body: formData
    });
  }
};

export const ordersApi = {
  createOrder: (payload) => apiRequest('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  getOrders: (status = 'ALL') => {
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return apiRequest(`/orders${query}`);
  },

  getOrderById: (orderId) => apiRequest(`/orders/${encodeURIComponent(orderId)}`),

  acceptOrder: (orderId) => apiRequest(`/orders/${encodeURIComponent(orderId)}/accept`, {
    method: 'POST',
  }),

  rejectOrder: (orderId, reason) => apiRequest(`/orders/${encodeURIComponent(orderId)}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),

  confirmPayment: (orderId) => apiRequest(`/orders/${encodeURIComponent(orderId)}/confirm-payment`, {
    method: 'POST',
  }),

  completeOrder: (orderId) => apiRequest(`/orders/${encodeURIComponent(orderId)}/complete`, {
    method: 'POST',
  }),

  cancelOrder: (orderId, reason) => apiRequest(`/orders/${encodeURIComponent(orderId)}/cancel`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  }),
};
