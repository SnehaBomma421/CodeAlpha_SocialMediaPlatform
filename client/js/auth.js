/**
 * SocialSphere — Authentication Script
 * Handles login, registration, form validation, avatar upload
 */

document.addEventListener('DOMContentLoaded', () => {
  initPasswordToggle();
  initLoginForm();
  initRegisterForm();
});

// ─── Password Visibility Toggle ───────────────────────────

function initPasswordToggle() {
  const toggles = document.querySelectorAll('.password-toggle');
  toggles.forEach((toggle) => {
    toggle.addEventListener('click', () => {
      const input = toggle.closest('.password-input-wrapper').querySelector('input');
      const icon = toggle.querySelector('i');
      if (input.type === 'password') {
        input.type = 'text';
        icon.className = 'fas fa-eye-slash';
      } else {
        input.type = 'password';
        icon.className = 'fas fa-eye';
      }
    });
  });
}

// ─── Login Form ───────────────────────────────────────────

function initLoginForm() {
  const form = document.getElementById('loginForm');
  if (!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const btn = document.getElementById('loginBtn');
    let isValid = true;

    // Validate
    if (!email) {
      showError('emailError', 'Email is required');
      isValid = false;
    }

    if (!password) {
      showError('passwordError', 'Password is required');
      isValid = false;
    }

    if (!isValid) return;

    // Show loading
    setButtonLoading(btn, true);

    try {
      const data = await API.auth.login({ email, password });

      if (data.success) {
        API.setAuth(data.token, data.user);
        showToast('Welcome back! Redirecting...', 'success');
        setTimeout(() => {
          window.location.href = 'feed.html';
        }, 800);
      }
    } catch (error) {
      showToast(error.message || 'Login failed. Please try again.', 'error');

      if (error.message && error.message.includes('password')) {
        showError('passwordError', error.message);
      } else if (error.message) {
        showError('emailError', error.message);
      }
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

// ─── Register Form ────────────────────────────────────────

function initRegisterForm() {
  const form = document.getElementById('registerForm');
  if (!form) return;

  // Avatar upload
  const avatarInput = document.getElementById('avatarInput');
  const avatarPreview = document.getElementById('avatarPreview');
  const avatarImg = document.getElementById('avatarImg');

  if (avatarPreview && avatarInput) {
    avatarPreview.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          avatarImg.src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Password strength
  const passwordInput = document.getElementById('password');
  const strengthBar = document.querySelector('.strength-bar');

  if (passwordInput && strengthBar) {
    passwordInput.addEventListener('input', () => {
      const val = passwordInput.value;
      if (val.length === 0) {
        strengthBar.style.width = '0';
        strengthBar.className = 'strength-bar';
      } else if (val.length < 6) {
        strengthBar.className = 'strength-bar weak';
      } else if (val.length < 10) {
        strengthBar.className = 'strength-bar medium';
      } else {
        strengthBar.className = 'strength-bar strong';
      }
    });
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    const name = form.querySelector('#name').value.trim();
    const username = form.querySelector('#username').value.trim();
    const email = form.querySelector('#email').value.trim();
    const password = form.querySelector('#password').value;
    const confirmPassword = form.querySelector('#confirmPassword').value;
    const btn = document.getElementById('registerBtn');
    let isValid = true;

    // Validate
    if (!name || name.length < 2) {
      showError('nameError', 'Name must be at least 2 characters');
      isValid = false;
    }

    if (!username || username.length < 3) {
      showError('usernameError', 'Username must be at least 3 characters');
      isValid = false;
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      showError('usernameError', 'Only letters, numbers, and underscores');
      isValid = false;
    }

    if (!email) {
      showError('emailError', 'Email is required');
      isValid = false;
    }

    if (!password || password.length < 6) {
      showError('passwordError', 'Password must be at least 6 characters');
      isValid = false;
    }

    if (password !== confirmPassword) {
      showError('confirmPasswordError', 'Passwords do not match');
      isValid = false;
    }

    if (!isValid) return;

    // Build form data (supports avatar upload)
    const formData = new FormData();
    formData.append('name', name);
    formData.append('username', username);
    formData.append('email', email);
    formData.append('password', password);
    formData.append('confirmPassword', confirmPassword);

    if (avatarInput && avatarInput.files[0]) {
      formData.append('avatar', avatarInput.files[0]);
    }

    setButtonLoading(btn, true);

    try {
      const data = await API.auth.register(formData);

      if (data.success) {
        API.setAuth(data.token, data.user);
        showToast('Account created! Welcome to SocialSphere!', 'success');
        setTimeout(() => {
          window.location.href = 'feed.html';
        }, 800);
      }
    } catch (error) {
      if (error.data && error.data.errors) {
        // Show field-level errors
        error.data.errors.forEach((err) => {
          const field = err.field;
          if (field === 'name') showError('nameError', err.message);
          else if (field === 'username') showError('usernameError', err.message);
          else if (field === 'email') showError('emailError', err.message);
          else if (field === 'password') showError('passwordError', err.message);
          else if (field === 'confirmPassword') showError('confirmPasswordError', err.message);
        });
      } else {
        showToast(error.message || 'Registration failed. Please try again.', 'error');
      }
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

// ─── Helper Functions ─────────────────────────────────────

function showError(elementId, message) {
  const el = document.getElementById(elementId);
  if (el) {
    el.textContent = message;
    // Highlight the corresponding input
    const input = el.closest('.form-group')?.querySelector('input');
    if (input) input.classList.add('input-error');
  }
}

function clearErrors() {
  document.querySelectorAll('.error-message').forEach((el) => (el.textContent = ''));
  document.querySelectorAll('.input-error').forEach((el) => el.classList.remove('input-error'));
}

