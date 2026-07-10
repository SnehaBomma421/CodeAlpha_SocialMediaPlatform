/**
 * SocialSphere — Feed Script
 * Main feed with infinite scroll, post rendering, likes, comments
 * Also handles explore page rendering
 */

let currentPage = 1;
let isLoading = false;
let hasMore = true;
const POSTS_PER_PAGE = 10;

document.addEventListener('DOMContentLoaded', () => {
  const feedElement = document.getElementById('feedPosts');
  const explorePosts = document.getElementById('explorePosts');

  if (feedElement) {
    initFeed();
  }

  if (explorePosts) {
    initExplore();
  }

  initImageModal();
});

// ─── Feed Initialization ──────────────────────────────────

function initFeed() {
  loadPosts();

  // Infinite scroll
  window.addEventListener('scroll', () => {
    if (isLoading || !hasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= pageHeight - 800) {
      loadMorePosts();
    }
  });

  // Load user quick info and suggestions
  loadUserQuickInfo();
  loadTrendingHashtags();
  loadSuggestions();
}

async function loadPosts(page = 1) {
  const feedElement = document.getElementById('feedPosts');
  const loader = document.getElementById('feedLoader');
  const noPosts = document.getElementById('noPosts');
  const feedEnd = document.getElementById('feedEnd');

  if (!feedElement) return;

  isLoading = true;

  try {
    const data = await API.posts.getAll(page, POSTS_PER_PAGE);

    // Remove skeletons on first load
    if (page === 1) {
      feedElement.innerHTML = '';
    }

    if (data.success && data.posts.length > 0) {
      data.posts.forEach((post) => {
        feedElement.appendChild(createPostElement(post));
      });

      hasMore = data.pagination.hasMore;
      currentPage = page;

      if (noPosts) noPosts.style.display = 'none';
      if (feedEnd) feedEnd.style.display = hasMore ? 'none' : 'block';
    } else if (page === 1) {
      if (noPosts) noPosts.style.display = 'block';
      if (feedEnd) feedEnd.style.display = 'none';
    }
  } catch (error) {
    console.error('Failed to load posts:', error);
    showToast('Failed to load posts. Please refresh.', 'error');
  } finally {
    isLoading = false;
    if (loader) loader.style.display = 'none';
  }
}

function loadMorePosts() {
  const loader = document.getElementById('feedLoader');
  if (loader) loader.style.display = 'flex';
  loadPosts(currentPage + 1);
}

// ─── Create Post HTML Element ────────────────────────────

function createPostElement(post) {
  const article = document.createElement('article');
  article.className = 'post-card';
  article.dataset.postId = post._id;

  const user = post.user || {};
  const avatarSrc = user.avatar || getAvatarUrl(user.name || 'User');
  const timeAgo = formatDate(post.createdAt);
  const caption = post.caption || '';
  const likesCount = post.likesCount || 0;
  const commentsCount = post.commentsCount || 0;
  const isLiked = post.isLiked || false;

  // Check if current user owns this post
  const currentUser = API.getUser();
  const isOwner = currentUser && currentUser._id === (user._id || '');

  let optionsMenu = '';
  if (isOwner) {
    optionsMenu = `
      <div class="post-actions-btn">
        <button class="post-options-btn"><i class="fas fa-ellipsis-h"></i></button>
        <div class="post-options-menu">
          <button class="edit-post-btn" data-post-id="${post._id}" data-caption="${escapeHtml(caption)}">
            <i class="fas fa-edit"></i> Edit
          </button>
          <button class="delete-post-btn" data-post-id="${post._id}">
            <i class="fas fa-trash"></i> Delete
          </button>
        </div>
      </div>
    `;
  }

  article.innerHTML = `
    <div class="post-header">
      <img src="${avatarSrc}" alt="${escapeHtml(user.name || 'User')}" class="post-user-avatar"
           onclick="window.location.href='profile.html?id=${user._id || ''}'" />
      <div class="post-user-info">
        <div class="post-username" onclick="window.location.href='profile.html?id=${user._id || ''}'">
          ${escapeHtml(user.name || 'Unknown')}
        </div>
        <div class="post-time">${timeAgo}</div>
      </div>
      ${optionsMenu}
    </div>
    ${post.image ? `<div class="post-image-container">
      <img src="${post.image}" alt="Post image" class="post-image" loading="lazy" />
    </div>` : ''}
    <div class="post-caption">
      <span class="post-username-inline" onclick="window.location.href='profile.html?id=${user._id || ''}'">
        ${escapeHtml(user.name || 'Unknown')}
      </span>
      ${highlightHashtags(escapeHtml(caption))}
    </div>
    <div class="post-stats-bar">
      <span>${formatNumber(likesCount)} like${likesCount !== 1 ? 's' : ''}</span>
      <span>${formatNumber(commentsCount)} comment${commentsCount !== 1 ? 's' : ''}</span>
    </div>
    <div class="post-actions">
      <button class="post-action-btn like-btn ${isLiked ? 'liked' : ''}" data-post-id="${post._id}">
        <i class="${isLiked ? 'fas' : 'far'} fa-heart"></i>
        <span class="post-action-count">${formatNumber(likesCount)}</span>
      </button>
      <button class="post-action-btn comment-btn" data-post-id="${post._id}">
        <i class="far fa-comment"></i>
        <span>${formatNumber(commentsCount)}</span>
      </button>
      <button class="post-action-btn share-btn" data-post-id="${post._id}">
        <i class="far fa-share-square"></i>
        <span>Share</span>
      </button>
    </div>
  `;

  // ─── Attach event listeners ──────────────────────────────

  // Image click to open modal
  const img = article.querySelector('.post-image');
  if (img) {
    img.addEventListener('click', () => openImageModal(post.image));
  }

  // Like button
  const likeBtn = article.querySelector('.like-btn');
  likeBtn.addEventListener('click', async () => {
    likeBtn.disabled = true;
    try {
      if (likeBtn.classList.contains('liked')) {
        const data = await API.posts.unlike(post._id);
        likeBtn.classList.remove('liked');
        likeBtn.querySelector('i').className = 'far fa-heart';
        likeBtn.querySelector('.post-action-count').textContent = formatNumber(data.likesCount);
      } else {
        const data = await API.posts.like(post._id);
        likeBtn.classList.add('liked');
        likeBtn.querySelector('i').className = 'fas fa-heart';
        likeBtn.querySelector('.post-action-count').textContent = formatNumber(data.likesCount);
      }
      // Update stats bar
      const statsBar = article.querySelector('.post-stats-bar');
      if (statsBar) {
        const likeSpan = statsBar.querySelector('span:first-child');
        if (likeSpan) {
          const count = parseInt(likeBtn.querySelector('.post-action-count').textContent.replace(/[KMB]/g, ''));
          likeSpan.textContent = `${formatNumber(count)} like${count !== 1 ? 's' : ''}`;
        }
      }
    } catch (error) {
      showToast(error.message || 'Failed to update like', 'error');
    } finally {
      likeBtn.disabled = false;
    }
  });

  // Comment button
  const commentBtn = article.querySelector('.comment-btn');
  commentBtn.addEventListener('click', () => {
    openCommentsModal(post._id);
  });

  // Share button
  const shareBtn = article.querySelector('.share-btn');
  shareBtn.addEventListener('click', () => {
    const url = `${window.location.origin}/feed.html?post=${post._id}`;
    if (navigator.share) {
      navigator.share({ title: 'Check out this post on SocialSphere', url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        showToast('Link copied to clipboard!', 'success');
      });
    }
  });

  // Post options menu
  const optionsBtn = article.querySelector('.post-options-btn');
  if (optionsBtn) {
    optionsBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const menu = optionsBtn.nextElementSibling;
      // Close all other menus
      document.querySelectorAll('.post-options-menu.show').forEach((m) => m.classList.remove('show'));
      menu.classList.toggle('show');
    });

    // Delete post
    const deleteBtn = article.querySelector('.delete-post-btn');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', async () => {
        if (confirm('Delete this post?')) {
          try {
            await API.posts.delete(post._id);
            article.remove();
            showToast('Post deleted', 'success');
          } catch (error) {
            showToast(error.message || 'Failed to delete post', 'error');
          }
        }
      });
    }

    // Edit post
    const editBtn = article.querySelector('.edit-post-btn');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const captionText = editBtn.dataset.caption;
        const newCaption = prompt('Edit caption:', captionText);
        if (newCaption !== null) {
          API.posts.update(post._id, { caption: newCaption })
            .then((data) => {
              if (data.success) {
                article.querySelector('.post-caption').innerHTML = `
                  <span class="post-username-inline">${escapeHtml(user.name || 'Unknown')}</span>
                  ${highlightHashtags(escapeHtml(newCaption))}
                `;
                showToast('Post updated', 'success');
              }
            })
            .catch((err) => showToast(err.message, 'error'));
        }
      });
    }
  }

  // Close options menu on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.post-actions-btn')) {
      document.querySelectorAll('.post-options-menu.show').forEach((m) => m.classList.remove('show'));
    }
  });

  return article;
}

// ─── Comments Modal ───────────────────────────────────────

function openCommentsModal(postId) {
  const existing = document.getElementById('commentsModal');
  if (existing) existing.remove();

  const modal = document.createElement('div');
  modal.id = 'commentsModal';
  modal.className = 'image-modal';
  modal.style.cssText = 'display:flex; align-items:flex-end; justify-content:center; padding:0;';

  modal.innerHTML = `
    <div class="comments-modal-content" style="
      background:var(--bg-secondary);
      max-width:500px;
      width:100%;
      max-height:80vh;
      border-radius:20px 20px 0 0;
      padding:20px;
      overflow-y:auto;
      animation:fadeInUp 0.3s ease;
    ">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">
        <h3 style="font-size:1.1rem;"><i class="fas fa-comments"></i> Comments</h3>
        <button id="closeCommentsBtn" style="background:none;border:none;color:var(--text-muted);font-size:1.2rem;cursor:pointer;">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div id="commentsList" style="margin-bottom:16px; min-height:100px;">
        <div class="feed-loader"><div class="spinner"></div><span>Loading comments...</span></div>
      </div>

      <div style="display:flex; gap:8px; border-top:1px solid var(--border-glass); padding-top:12px;">
        <input type="text" id="commentInput" placeholder="Write a comment..."
               style="flex:1; padding:12px 16px; border:1px solid var(--border-glass); border-radius:12px;
                      background:var(--input-bg); color:var(--text-primary); font-family:'Inter',sans-serif;
                      font-size:0.9rem; outline:none;" />
        <button id="submitCommentBtn" class="btn btn-primary" style="padding:10px 20px;">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;

  document.body.appendChild(modal);

  // Load comments
  loadComments(postId);

  // Submit comment
  const commentInput = document.getElementById('commentInput');
  const submitBtn = document.getElementById('submitCommentBtn');

  submitBtn.addEventListener('click', () => addComment(postId));
  commentInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addComment(postId);
    }
  });

  // Close handlers
  document.getElementById('closeCommentsBtn').addEventListener('click', () => modal.remove());
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.remove();
  });
}

async function loadComments(postId) {
  const list = document.getElementById('commentsList');
  if (!list) return;

  try {
    const data = await API.comments.getByPost(postId);
    list.innerHTML = '';

    if (data.success && data.comments.length > 0) {
      data.comments.forEach((comment) => {
        list.appendChild(createCommentElement(comment, postId));
      });
    } else {
      list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">No comments yet. Be the first!</div>';
    }
  } catch (error) {
    list.innerHTML = '<div style="text-align:center;padding:32px;color:var(--text-muted);">Failed to load comments.</div>';
  }
}

function createCommentElement(comment, postId) {
  const div = document.createElement('div');
  div.style.cssText = 'display:flex;gap:10px;padding:12px 0;border-bottom:1px solid var(--border-glass);';
  div.dataset.commentId = comment._id;

  const user = comment.user || {};
  const avatarSrc = user.avatar || getAvatarUrl(user.name || 'User');
  const currentUser = API.getUser();
  const isOwner = currentUser && currentUser._id === (user._id || '');

  div.innerHTML = `
    <img src="${avatarSrc}" alt="" style="width:36px;height:36px;border-radius:50%;object-fit:cover;flex-shrink:0;" />
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
        <strong style="font-size:0.85rem;">${escapeHtml(user.name || 'Unknown')}</strong>
        <span style="font-size:0.75rem;color:var(--text-muted);">${formatDate(comment.createdAt)}</span>
        ${isOwner ? `
          <button class="delete-comment-btn" style="margin-left:auto;background:none;border:none;color:var(--text-muted);cursor:pointer;font-size:0.8rem;padding:4px;">
            <i class="fas fa-trash"></i>
          </button>
        ` : ''}
      </div>
      <p style="font-size:0.9rem;margin-top:4px;line-height:1.4;">${escapeHtml(comment.text)}</p>
    </div>
  `;

  const deleteBtn = div.querySelector('.delete-comment-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', async () => {
      if (confirm('Delete this comment?')) {
        try {
          await API.comments.delete(comment._id);
          div.remove();
          showToast('Comment deleted', 'success');
        } catch (error) {
          showToast(error.message, 'error');
        }
      }
    });
  }

  return div;
}

async function addComment(postId) {
  const input = document.getElementById('commentInput');
  const text = input.value.trim();
  if (!text) return;

  input.disabled = true;
  const submitBtn = document.getElementById('submitCommentBtn');
  submitBtn.disabled = true;

  try {
    const data = await API.comments.add(postId, text);
    if (data.success) {
      input.value = '';
      // Reload comments to show the new one
      loadComments(postId);
      showToast('Comment added!', 'success');
    }
  } catch (error) {
    showToast(error.message || 'Failed to add comment', 'error');
  } finally {
    input.disabled = false;
    submitBtn.disabled = false;
    input.focus();
  }
}

// ─── Sidebar Components ──────────────────────────────────

async function loadUserQuickInfo() {
  const container = document.getElementById('userQuickInfo');
  if (!container) return;

  try {
    const data = await API.users.getProfile();
    if (data.success && data.user) {
      const user = data.user;
      const avatarSrc = user.avatar || getAvatarUrl(user.name);

      container.innerHTML = `
        <a href="profile.html" class="quick-user-info">
          <img src="${avatarSrc}" alt="" class="quick-user-avatar" />
          <div class="quick-user-details">
            <h4>${escapeHtml(user.name)}</h4>
            <span>@${escapeHtml(user.username)}</span>
          </div>
        </a>
      `;
    }
  } catch (error) {
    // Silently fail
  }
}

async function loadTrendingHashtags() {
  const container = document.getElementById('trendingList');
  const exploreContainer = document.getElementById('exploreHashtags');
  if (!container && !exploreContainer) return;

  try {
    const data = await API.posts.trending();
    if (data.success && data.hashtags.length > 0) {
      const html = data.hashtags
        .map(
          (h) => `
        <div class="trending-item" onclick="window.location.href='search.html?q=%23${encodeURIComponent(h.tag)}'">
          <span class="trending-tag">#${escapeHtml(h.tag)}</span>
          <span class="trending-count">${h.count} post${h.count !== 1 ? 's' : ''}</span>
        </div>
      `
        )
        .join('');

      if (container) container.innerHTML = html;
      if (exploreContainer) exploreContainer.innerHTML = html;
    } else {
      if (container) container.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No trending hashtags yet</p>';
      if (exploreContainer) exploreContainer.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No trending hashtags yet</p>';
    }
  } catch (error) {
    // Silently fail
  }
}

async function loadSuggestions() {
  const container = document.getElementById('suggestionsList');
  const exploreContainer = document.getElementById('exploreUsers');
  if (!container && !exploreContainer) return;

  try {
    const data = await API.users.suggestions();
    if (data.success && data.users.length > 0) {
      const html = data.users
        .map(
          (user) => `
        <div class="suggestion-item">
          <img src="${user.avatar || getAvatarUrl(user.name, 36)}" alt="" class="suggestion-avatar" />
          <div class="suggestion-info" onclick="window.location.href='profile.html?id=${user._id}'">
            <div class="suggestion-name">${escapeHtml(user.name)}</div>
            <div class="suggestion-username">@${escapeHtml(user.username)}</div>
          </div>
          <button class="suggestion-follow-btn follow" data-user-id="${user._id}">Follow</button>
        </div>
      `
        )
        .join('');

      if (container) container.innerHTML = html;
      if (exploreContainer) {
        const gridHtml = data.users
          .map(
            (user) => `
          <div class="suggested-user-card">
            <img src="${user.avatar || getAvatarUrl(user.name, 64)}" alt="" />
            <h4>${escapeHtml(user.name)}</h4>
            <span>@${escapeHtml(user.username)}</span>
            <button class="suggestion-follow-btn follow" data-user-id="${user._id}">Follow</button>
          </div>
        `
          )
          .join('');
        exploreContainer.innerHTML = gridHtml;
      }

      // Attach follow handlers
      document.querySelectorAll('.suggestion-follow-btn.follow').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const userId = btn.dataset.userId;
          try {
            await API.users.follow(userId);
            btn.textContent = 'Following';
            btn.className = 'suggestion-follow-btn following';
            showToast('User followed!', 'success');
          } catch (error) {
            showToast(error.message, 'error');
          }
        });
      });

      document.querySelectorAll('.suggestion-follow-btn.following').forEach((btn) => {
        btn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const userId = btn.dataset.userId;
          try {
            await API.users.unfollow(userId);
            btn.textContent = 'Follow';
            btn.className = 'suggestion-follow-btn follow';
            showToast('User unfollowed', 'info');
          } catch (error) {
            showToast(error.message, 'error');
          }
        });
      });
    } else {
      const emptyMsg = '<p style="color:var(--text-muted);font-size:0.85rem;">No suggestions right now</p>';
      if (container) container.innerHTML = emptyMsg;
      if (exploreContainer) exploreContainer.innerHTML = emptyMsg;
    }
  } catch (error) {
    // Silently fail
  }
}

// ─── Explore Page ─────────────────────────────────────────

async function initExplore() {
  const explorePosts = document.getElementById('explorePosts');
  if (!explorePosts) return;

  loadTrendingHashtags();
  loadSuggestions();

  // Load recent posts
  try {
    const data = await API.posts.getAll(1, 6);
    if (data.success && data.posts.length > 0) {
      explorePosts.innerHTML = '';
      data.posts.forEach((post) => {
        explorePosts.appendChild(createPostElement(post));
      });
    } else {
      explorePosts.innerHTML = '<div class="empty-state"><p>No posts to explore yet.</p></div>';
    }
  } catch (error) {
    explorePosts.innerHTML = '<div class="empty-state"><p>Failed to load posts.</p></div>';
  }
}

// ─── Image Modal (Post image viewer) ─────────────────────

function initImageModal() {
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      const modal = document.querySelector('.image-modal');
      if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
      }
    }
  });
}
