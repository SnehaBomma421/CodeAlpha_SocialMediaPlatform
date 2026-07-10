/**
 * SocialSphere — Profile Script
 * Handles profile page: viewing, editing, tabs, user's posts, liked posts
 */

document.addEventListener('DOMContentLoaded', () => {
  const profileContainer = document.getElementById('profileContainer');
  if (!profileContainer && !document.getElementById('profileHeader')) return;

  initProfile();
});

let profileUserId = null;

function initProfile() {
  // Check if viewing another user's profile
  const params = new URLSearchParams(window.location.search);
  profileUserId = params.get('id') || null;

  loadProfile(profileUserId);
  initTabs();
  initEditProfile();
}

async function loadProfile(userId = null) {
  const header = document.getElementById('profileHeader');
  const stats = document.getElementById('profileStats');
  const editTabBtn = document.getElementById('editProfileTabBtn');
  if (!header) return;

  try {
    let data;
    if (userId) {
      data = await API.users.getById(userId);
    } else {
      data = await API.users.getProfile();
    }

    if (data.success) {
      const user = data.user;

      const avatarSrc = user.avatar || getAvatarUrl(user.name, 120);

      // Check if this is own profile
      const currentUser = API.getUser();
      const isOwnProfile = !userId || (currentUser && currentUser._id === userId);

      // Follow button (only for other users)
      let followBtnHtml = '';
      if (!isOwnProfile) {
        const isFollowing = user.isFollowing || false;
        followBtnHtml = `
          <button class="profile-follow-btn ${isFollowing ? 'following' : 'follow'}"
                  data-user-id="${user._id}" id="profileFollowBtn">
            ${isFollowing ? 'Following' : 'Follow'}
          </button>
        `;
      } else if (editTabBtn) {
        editTabBtn.style.display = 'flex';
      }

      header.innerHTML = `
        <div class="profile-avatar-section">
          <img src="${avatarSrc}" alt="${escapeHtml(user.name)}" class="profile-avatar" />
        </div>
        <h1 class="profile-name">${escapeHtml(user.name)}</h1>
        <div class="profile-username">@${escapeHtml(user.username)}</div>
        ${user.bio ? `<p class="profile-bio">${escapeHtml(user.bio)}</p>` : ''}
        <div class="profile-actions">
          ${followBtnHtml}
        </div>
      `;

      // Update stats
      if (stats) {
        stats.innerHTML = `
          <div class="stat">
            <span class="stat-number">${user.totalPosts || 0}</span>
            <span class="stat-label">Posts</span>
          </div>
          <div class="stat">
            <span class="stat-number">${formatNumber(user.followersCount || 0)}</span>
            <span class="stat-label">Followers</span>
          </div>
          <div class="stat">
            <span class="stat-number">${formatNumber(user.followingCount || 0)}</span>
            <span class="stat-label">Following</span>
          </div>
        `;
      }

      // Attach follow button handler
      const followBtn = document.getElementById('profileFollowBtn');
      if (followBtn) {
        followBtn.addEventListener('click', async () => {
          try {
            if (followBtn.classList.contains('follow')) {
              await API.users.follow(user._id);
              followBtn.textContent = 'Following';
              followBtn.className = 'profile-follow-btn following';
              showToast('User followed!', 'success');
              // Refresh profile to update counts
              setTimeout(() => loadProfile(userId), 1000);
            } else {
              await API.users.unfollow(user._id);
              followBtn.textContent = 'Follow';
              followBtn.className = 'profile-follow-btn follow';
              showToast('User unfollowed', 'info');
              setTimeout(() => loadProfile(userId), 1000);
            }
          } catch (error) {
            showToast(error.message, 'error');
          }
        });
      }

      // Load user's posts
      loadProfilePosts(user._id);
    }
  } catch (error) {
    header.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon"><i class="fas fa-exclamation-triangle"></i></div>
        <h3>Failed to load profile</h3>
        <p>${escapeHtml(error.message || 'Please try again')}</p>
        <a href="feed.html" class="btn btn-primary">Go Back</a>
      </div>
    `;
  }
}

async function loadProfilePosts(userId) {
  const container = document.getElementById('profilePosts');
  const noPosts = document.getElementById('noProfilePosts');
  if (!container) return;

  try {
    const data = await API.posts.getAll(1, 20, userId);

    container.innerHTML = '';

    if (data.success && data.posts.length > 0) {
      data.posts.forEach((post) => {
        container.appendChild(createPostElement(post));
      });
      if (noPosts) noPosts.style.display = 'none';
    } else {
      if (noPosts) noPosts.style.display = 'block';
    }
  } catch (error) {
    container.innerHTML = '<div class="empty-state"><p>Failed to load posts.</p></div>';
  }
}

async function loadLikedPosts() {
  const container = document.getElementById('likedPosts');
  const noPosts = document.getElementById('noLikedPosts');
  if (!container) return;

  // Liked posts are fetched from the currently viewed user's likes
  // Since API doesn't have a dedicated liked endpoint, we show a message
  container.innerHTML = '';
  if (noPosts) noPosts.style.display = 'block';
}

// ─── Tabs ─────────────────────────────────────────────────

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      // Update active tab
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');

      // Show corresponding content
      const tabName = tab.dataset.tab;
      document.querySelectorAll('.tab-content').forEach((c) => c.classList.remove('active'));

      if (tabName === 'posts') {
        document.getElementById('tabPosts').classList.add('active');
      } else if (tabName === 'liked') {
        document.getElementById('tabLiked').classList.add('active');
        loadLikedPosts();
      } else if (tabName === 'edit') {
        document.getElementById('editProfileForm').style.display = 'block';
        document.getElementById('tabPosts').classList.add('active');
        populateEditForm();
      }
    });
  });
}

// ─── Edit Profile ─────────────────────────────────────────

function initEditProfile() {
  const form = document.getElementById('editProfileFormInner');
  if (!form) return;

  // Avatar change
  const changeBtn = document.getElementById('changeAvatarBtn');
  const avatarInput = document.getElementById('editAvatarInput');
  if (changeBtn && avatarInput) {
    changeBtn.addEventListener('click', () => avatarInput.click());
    avatarInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          document.getElementById('editAvatarPreview').src = event.target.result;
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Cancel
  const cancelBtn = document.getElementById('cancelEditBtn');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      document.getElementById('editProfileForm').style.display = 'none';
      document.querySelector('.tab-btn[data-tab="posts"]').click();
    });
  }

  // Bio character count
  const bioInput = document.getElementById('editBio');
  const bioCount = document.getElementById('bioCount');
  if (bioInput && bioCount) {
    bioInput.addEventListener('input', () => {
      bioCount.textContent = bioInput.value.length;
    });
  }

  // Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('saveProfileBtn');
    setButtonLoading(btn, true);

    try {
      const formData = new FormData();
      formData.append('name', document.getElementById('editName').value.trim());
      formData.append('username', document.getElementById('editUsername').value.trim());
      formData.append('bio', document.getElementById('editBio').value.trim());

      if (avatarInput && avatarInput.files[0]) {
        formData.append('avatar', avatarInput.files[0]);
      }

      const data = await API.users.updateProfile(formData);

      if (data.success) {
        // Update stored user
        const storedUser = API.getUser();
        if (storedUser) {
          API.setAuth(API.getToken(), { ...storedUser, ...data.user });
        }
        showToast('Profile updated!', 'success');
        document.getElementById('editProfileForm').style.display = 'none';
        document.querySelector('.tab-btn[data-tab="posts"]').click();
        loadProfile(profileUserId);
        updateNavAvatar();
      }
    } catch (error) {
      showToast(error.message || 'Failed to update profile', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
}

async function populateEditForm() {
  try {
    const data = await API.users.getProfile();
    if (data.success) {
      const user = data.user;
      document.getElementById('editName').value = user.name || '';
      document.getElementById('editUsername').value = user.username || '';
      document.getElementById('editBio').value = user.bio || '';

      const avatarPreview = document.getElementById('editAvatarPreview');
      if (avatarPreview) {
        avatarPreview.src = user.avatar || getAvatarUrl(user.name, 64);
      }

      const bioCount = document.getElementById('bioCount');
      if (bioCount) {
        bioCount.textContent = (user.bio || '').length;
      }
    }
  } catch (error) {
    showToast('Failed to load profile data', 'error');
  }
}
