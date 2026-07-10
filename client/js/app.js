/**
 * SocialSphere — Main App Script
 * Common utilities: theme toggle, navigation, toast notifications, image modals
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initNavigation();
  initGlobalSearch();
  checkAuth();
  loadNotificationsBadge();
});

// ─── Theme System ─────────────────────────────────────────

function initTheme() {
  const themeToggle = document.getElementById('themeToggle');
  if (!themeToggle) return;

  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeIcon(savedTheme);

  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
  });
}

function updateThemeIcon(theme) {
  const icon = document.querySelector('#themeToggle i');
  if (icon) {
    icon.className = theme === 'dark' ? 'fas fa-moon' : 'fas fa-sun';
  }
}

// ─── Navigation ──────────────────────────────────────────

function initNavigation() {
  // Mobile menu toggle
  const menuBtn = document.getElementById('mobileMenuBtn');
  const navLinks = document.querySelector('.nav-links');

  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      navLinks.classList.toggle('show');
    });

    // Close menu on link click
    navLinks.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('show');
      });
    });
  }

  // Highlight active page
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-link').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage) {
      link.classList.add('active');
    }
  });

  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', (e) => {
      e.preventDefault();
      API.clearAuth();
      showToast('Logged out successfully', 'success');
      setTimeout(() => {
        window.location.href = 'index.html';
      }, 500);
    });
  }

  // Update nav avatar
  updateNavAvatar();
}

function updateNavAvatar() {
  const user = API.getUser();
  const navAvatar = document.getElementById('navAvatar');
  if (navAvatar && user) {
    if (user.avatar) {
      navAvatar.src = user.avatar;
    } else {
      navAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'User')}&background=6c5ce7&color=fff&size=32`;
    }
  }
}

// ─── Global Search ───────────────────────────────────────

function initGlobalSearch() {
  const searchInputs = [
    document.getElementById('globalSearchInput'),
    document.getElementById('mobileSearchInput'),
  ];

  searchInputs.forEach((input) => {
    if (!input) return;

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  });
}

// ─── Auth Check ───────────────────────────────────────────

function checkAuth() {
  const publicPages = ['index.html', 'login.html', 'register.html', '404.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  // Skip auth check for public pages
  if (publicPages.includes(currentPage)) {
    return;
  }

  // Redirect to login if not authenticated
  if (!API.isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Verify token is still valid by fetching user data
  API.auth.me()
    .then((data) => {
      if (data.success && data.user) {
        // Update stored user data
        const currentUser = API.getUser();
        if (currentUser) {
          API.setAuth(API.getToken(), data.user);
          updateNavAvatar();
        }
      }
    })
    .catch((error) => {
      console.warn('Auth verification failed:', error.message);
    });
}

// ─── Notification Badge ──────────────────────────────────

async function loadNotificationsBadge() {
  const badge = document.getElementById('notifBadge');
  if (!badge || !API.isAuthenticated()) return;

  try {
    const data = await API.notifications.getAll(1);
    if (data.success && data.unreadCount > 0) {
      badge.textContent = data.unreadCount > 99 ? '99+' : data.unreadCount;
      badge.style.display = 'flex';
    } else {
      badge.style.display = 'none';
    }
  } catch (error) {
    // Silently fail — badge just won't show
  }
}

// ─── Toast Notification System ────────────────────────────

function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = {
    success: 'fa-check-circle',
    error: 'fa-exclamation-circle',
    info: 'fa-info-circle',
  };

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <div class="toast-icon">
      <i class="fas ${icons[type] || icons.info}"></i>
    </div>
    <span class="toast-message">${escapeHtml(message)}</span>
    <button class="toast-close">&times;</button>
  `;

  container.appendChild(toast);

  // Trigger entrance animation
  requestAnimationFrame(() => {
    toast.classList.add('show');
  });

  // Close button
  toast.querySelector('.toast-close').addEventListener('click', () => {
    removeToast(toast);
  });

  // Click to dismiss
  toast.addEventListener('click', (e) => {
    if (e.target === toast) {
      removeToast(toast);
    }
  });

  // Auto-remove after duration
  if (duration > 0) {
    setTimeout(() => {
      removeToast(toast);
    }, duration);
  }
}

function removeToast(toast) {
  if (toast.classList.contains('toast-exit')) return;
  toast.classList.remove('show');
  toast.classList.add('toast-exit');

  setTimeout(() => {
    if (toast.parentNode) {
      toast.parentNode.removeChild(toast);
    }
  }, 400);
}

// ─── Image Lightbox / Modal ──────────────────────────────

function openImageModal(src) {
  // Remove existing modal if any
  const existing = document.querySelector('.image-modal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.className = 'image-modal';
  modal.innerHTML = `
    <button class="image-modal-close"><i class="fas fa-times"></i></button>
    <img src="${escapeHtml(src)}" alt="Full size" />
  `;

  document.body.appendChild(modal);

  requestAnimationFrame(() => {
    modal.classList.add('show');
  });

  modal.addEventListener('click', (e) => {
    if (e.target === modal || e.target.closest('.image-modal-close')) {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
    }
  });

  // Close on Escape
  const escHandler = (e) => {
    if (e.key === 'Escape') {
      modal.classList.remove('show');
      setTimeout(() => modal.remove(), 300);
      document.removeEventListener('keydown', escHandler);
    }
  };
  document.addEventListener('keydown', escHandler);
}

// ─── Button Loading State ─────────────────────────────────

function setButtonLoading(btn, loading) {
  if (!btn) return;
  const text = btn.querySelector('.btn-text');
  const spinner = btn.querySelector('.spinner-sm');

  if (loading) {
    btn.disabled = true;
    btn.classList.add('loading');
    if (text) text.style.opacity = '0.5';
    if (spinner) spinner.style.display = 'inline-block';
  } else {
    btn.disabled = false;
    btn.classList.remove('loading');
    if (text) text.style.opacity = '1';
    if (spinner) spinner.style.display = 'none';
  }
}

// ─── Utility Functions ────────────────────────────────────

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function getAvatarUrl(name, size = 40) {
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=6c5ce7&color=fff&size=${size}`;
}

function extractHashtags(text) {
  if (!text) return [];
  const regex = /#[\w]+/g;
  return [...new Set((text.match(regex) || []).map((t) => t.toLowerCase()))];
}

function highlightHashtags(text) {
  if (!text) return '';
  return text.replace(/#([\w]+)/g, '<span class="hashtag">#$1</span>');
}
