const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

// In-memory token storage (with safe fallback for Capacitor)
let memoryAccessToken = null;

export const tokenStorage = {
  getAccessToken: () => {
    if (memoryAccessToken) return memoryAccessToken;
    return localStorage.getItem('mylawyer_access_token');
  },
  setAccessToken: (token) => {
    memoryAccessToken = token;
    if (token) {
      localStorage.setItem('mylawyer_access_token', token);
    } else {
      localStorage.removeItem('mylawyer_access_token');
    }
  },
  getRefreshToken: () => {
    return localStorage.getItem('mylawyer_refresh_token');
  },
  setRefreshToken: (token) => {
    if (token) {
      localStorage.setItem('mylawyer_refresh_token', token);
    } else {
      localStorage.removeItem('mylawyer_refresh_token');
    }
  },
  clearTokens: () => {
    memoryAccessToken = null;
    localStorage.removeItem('mylawyer_access_token');
    localStorage.removeItem('mylawyer_refresh_token');
    localStorage.removeItem('mylawyer_user');
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
