/**
 * SocialSphere — API Client
 * Centralized HTTP client for all backend API calls
 * Handles authentication tokens, error handling, and JSON parsing
 */

const API = (() => {
  const BASE_URL = '';  // Same origin in production

  /**
   * Get the stored JWT token
   */
  function getToken() {
    return localStorage.getItem('token');
  }

  /**
   * Check if user is authenticated
   */
  function isAuthenticated() {
    return !!getToken();
  }

  /**
   * Get stored user data
   */
  function getUser() {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Store user data after login/register
   */
  function setAuth(token, user) {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
  }

  /**
   * Clear auth data on logout
   */
  function clearAuth() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }

  /**
   * Core request function
   * @param {string} endpoint - API endpoint (e.g., '/api/auth/login')
   * @param {object} options - Fetch options
   * @returns {Promise<object>} Parsed JSON response
   */
  async function request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;

    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Attach auth token if available
    const token = getToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    // Don't set Content-Type for FormData (let browser set it with boundary)
    if (options.body instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        const error = new Error(data.message || 'Something went wrong');
        error.status = response.status;
        error.data = data;

        // If token expired/unauthorized, clear auth
        if (response.status === 401) {
          clearAuth();
          // Redirect to login if not already there
          if (!window.location.pathname.includes('login') &&
              !window.location.pathname.includes('register') &&
              !window.location.pathname.includes('index')) {
            window.location.href = '/login.html';
            return data;
          }
        }

        throw error;
      }

      return data;
    } catch (error) {
      if (error.status) {
        throw error; // Our custom error with server message
      }
      // Network error
      const networkError = new Error('Network error. Please check your connection.');
      networkError.isNetworkError = true;
      throw networkError;
    }
  }

  /**
   * HTTP GET request
   */
  function get(endpoint) {
    return request(endpoint, { method: 'GET' });
  }

  /**
   * HTTP POST request
   */
  function post(endpoint, body) {
    const options = { method: 'POST' };

    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }

    return request(endpoint, options);
  }

  /**
   * HTTP PUT request
   */
  function put(endpoint, body) {
    const options = { method: 'PUT' };

    if (body instanceof FormData) {
      options.body = body;
    } else {
      options.body = JSON.stringify(body);
    }

    return request(endpoint, options);
  }

  /**
   * HTTP DELETE request
   */
  function del(endpoint) {
    return request(endpoint, { method: 'DELETE' });
  }

  // ─── Public API ──────────────────────────────────────────

  return {
    // Auth
    getToken,
    isAuthenticated,
    getUser,
    setAuth,
    clearAuth,

    // HTTP methods
    get,
    post,
    put,
    delete: del,

    // ─── Auth Routes ────────────────────────────────────
    auth: {
      register: (data) => post('/api/auth/register', data),
      login: (data) => post('/api/auth/login', data),
      me: () => get('/api/auth/me'),
    },

    // ─── User Routes ────────────────────────────────────
    users: {
      getProfile: () => get('/api/users/profile'),
      updateProfile: (data) => put('/api/users/profile', data),
      getById: (id) => get(`/api/users/${id}`),
      follow: (id) => post(`/api/users/follow/${id}`),
      unfollow: (id) => del(`/api/users/unfollow/${id}`),
      search: (query) => get(`/api/users/search?q=${encodeURIComponent(query)}`),
      suggestions: () => get('/api/users/suggestions'),
    },

    // ─── Post Routes ────────────────────────────────────
    posts: {
      getAll: (page = 1, limit = 10, userId = '') => {
        let url = `/api/posts?page=${page}&limit=${limit}`;
        if (userId) url += `&userId=${userId}`;
        return get(url);
      },
      getById: (id) => get(`/api/posts/${id}`),
      create: (data) => post('/api/posts', data),
      update: (id, data) => put(`/api/posts/${id}`, data),
      delete: (id) => del(`/api/posts/${id}`),
      like: (id) => post(`/api/posts/${id}/like`),
      unlike: (id) => del(`/api/posts/${id}/unlike`),
      search: (query) => get(`/api/posts/search?q=${encodeURIComponent(query)}`),
      trending: () => get('/api/posts/trending'),
    },

    // ─── Comment Routes ─────────────────────────────────
    comments: {
      getByPost: (postId) => get(`/api/posts/${postId}/comments`),
      add: (postId, text) => post(`/api/posts/${postId}/comment`, { text }),
      update: (commentId, text) => put(`/api/comments/${commentId}`, { text }),
      delete: (commentId) => del(`/api/comments/${commentId}`),
    },

    // ─── Notification Routes ────────────────────────────
    notifications: {
      getAll: (page = 1) => get(`/api/notifications?page=${page}`),
      markRead: (id) => put(`/api/notifications/read/${id}`),
      markAllRead: () => put('/api/notifications/read-all'),
      delete: (id) => del(`/api/notifications/${id}`),
    },
  };
})();
