/**
 * SocialSphere — Search Script
 * Handles searching users, posts, and hashtags with type tabs
 */

let searchTimeout = null;
const RECENT_SEARCHES_KEY = 'socialsphere_recent_searches';

document.addEventListener('DOMContentLoaded', () => {
  const searchContainer = document.getElementById('searchContainer');
  if (!searchContainer && !document.getElementById('searchInput')) return;

  initSearch();

  // Check for query param
  const params = new URLSearchParams(window.location.search);
  const query = params.get('q');
  if (query) {
    const input = document.getElementById('searchInput');
    if (input) {
      input.value = query;
      performSearch(query);
    }
  }
});

function initSearch() {
  const input = document.getElementById('searchInput');
  const clearBtn = document.getElementById('searchClear');
  const typeBtns = document.querySelectorAll('.search-type-btn');
  if (!input) return;

  // Show recent searches on focus
  input.addEventListener('focus', () => {
    loadRecentSearches();
  });

  // Search with debounce
  input.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    const query = input.value.trim();

    if (clearBtn) {
      clearBtn.style.display = query ? 'flex' : 'none';
    }

    if (query.length >= 2) {
      searchTimeout = setTimeout(() => performSearch(query), 400);
    } else {
      hideResults();
      showRecentSearches();
    }
  });

  // Clear search
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      input.value = '';
      clearBtn.style.display = 'none';
      hideResults();
      showRecentSearches();
      input.focus();
    });
  }

  // Type tabs
  typeBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      typeBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      const query = input.value.trim();
      if (query) performSearch(query);
    });
  });
}

async function performSearch(query) {
  const results = document.getElementById('searchResults');
  const empty = document.getElementById('searchEmpty');
  const recent = document.getElementById('recentSearches');
  const loader = document.getElementById('searchLoader');
  const activeType = document.querySelector('.search-type-btn.active')?.dataset.type || 'users';

  if (!results) return;

  // Show loader
  if (loader) loader.style.display = 'flex';
  if (results) results.style.display = 'none';
  if (empty) empty.style.display = 'none';
  if (recent) recent.style.display = 'none';

  // Save to recent searches
  saveRecentSearch(query);

  try {
    let userData = null;
    let postData = null;

    // Fetch based on active tab
    if (activeType === 'users' || activeType === 'hashtags') {
      try {
        userData = await API.users.search(query);
      } catch (e) { /* ignore */ }
    }

    if (activeType === 'posts' || activeType === 'hashtags') {
      try {
        postData = await API.posts.search(query);
      } catch (e) { /* ignore */ }
    }

    if (loader) loader.style.display = 'none';

    const users = userData?.users || [];
    const posts = postData?.posts || [];

    // Show results
    let hasResults = false;
    results.innerHTML = '';

    // User results
    if (activeType === 'users' || activeType === 'hashtags') {
      const userSection = document.createElement('div');
      userSection.id = 'userResults';
      userSection.className = 'search-section';

      if (users.length > 0) {
        hasResults = true;
        userSection.innerHTML = `<h3 class="search-section-title"><i class="fas fa-users"></i> People</h3>`;
        users.forEach((user) => {
          const avatarSrc = user.avatar || getAvatarUrl(user.name, 48);
          userSection.innerHTML += `
            <div class="search-user-item" onclick="window.location.href='profile.html?id=${user._id}'">
              <img src="${avatarSrc}" alt="" class="search-user-avatar" />
              <div class="search-user-info">
                <div class="search-user-name">${escapeHtml(user.name)}</div>
                <div class="search-user-username">@${escapeHtml(user.username)}</div>
              </div>
            </div>
          `;
        });
      } else if (activeType === 'users') {
        // Only show "no users" if specifically searching users
      }
      results.appendChild(userSection);
    }

    // Post results
    if (activeType === 'posts' || activeType === 'hashtags') {
      const postSection = document.createElement('div');
      postSection.id = 'postResults';
      postSection.className = 'search-section';

      if (posts.length > 0) {
        hasResults = true;
        postSection.innerHTML = `<h3 class="search-section-title"><i class="fas fa-file-alt"></i> Posts</h3>`;
        posts.forEach((post) => {
          postSection.appendChild(createPostElement(post));
        });
      }
      results.appendChild(postSection);
    }

    if (hasResults) {
      results.style.display = 'block';
      if (empty) empty.style.display = 'none';
    } else {
      if (empty) empty.style.display = 'block';
    }
  } catch (error) {
    if (loader) loader.style.display = 'none';
    if (empty) {
      empty.querySelector('h3').textContent = 'Search failed';
      empty.querySelector('p').textContent = error.message || 'Please try again';
      empty.style.display = 'block';
    }
  }
}

function hideResults() {
  const results = document.getElementById('searchResults');
  const empty = document.getElementById('searchEmpty');
  if (results) results.style.display = 'none';
  if (empty) empty.style.display = 'none';
}

function showRecentSearches() {
  const recent = document.getElementById('recentSearches');
  if (recent) recent.style.display = 'block';
}

// ─── Recent Searches ──────────────────────────────────────

function loadRecentSearches() {
  const container = document.getElementById('recentList');
  if (!container) return;

  const searches = getRecentSearches();
  if (searches.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;padding:8px 14px;">No recent searches</p>';
    return;
  }

  container.innerHTML = searches
    .map(
      (q) => `
    <div class="recent-item" onclick="document.getElementById('searchInput').value='${escapeHtml(q)}';performSearch('${escapeHtml(q)}');">
      <i class="fas fa-history"></i>
      <span>${escapeHtml(q)}</span>
    </div>
  `
    )
    .join('');
}

function getRecentSearches() {
  try {
    const data = localStorage.getItem(RECENT_SEARCHES_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveRecentSearch(query) {
  let searches = getRecentSearches();
  // Remove if exists, add to front
  searches = searches.filter((s) => s.toLowerCase() !== query.toLowerCase());
  searches.unshift(query);
  // Keep max 8
  searches = searches.slice(0, 8);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(searches));
}
