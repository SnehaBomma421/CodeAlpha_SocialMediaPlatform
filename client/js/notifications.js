/**
 * SocialSphere — Notifications Script
 * Displays user notifications with read/unread states
 */

let notifPage = 1;
let notifHasMore = true;
let notifLoading = false;

document.addEventListener('DOMContentLoaded', () => {
  const notifContainer = document.getElementById('notificationsContainer');
  if (!notifContainer && !document.getElementById('notificationsList')) return;

  initNotifications();
});

function initNotifications() {
  loadNotifications();

  // Mark all read
  const markAllBtn = document.getElementById('markAllReadBtn');
  if (markAllBtn) {
    markAllBtn.addEventListener('click', async () => {
      try {
        await API.notifications.markAllRead();
        document.querySelectorAll('.notification-item.unread').forEach((item) => {
          item.classList.remove('unread');
        });
        const badge = document.getElementById('notifBadge');
        if (badge) badge.style.display = 'none';
        showToast('All notifications marked as read', 'success');
      } catch (error) {
        showToast(error.message, 'error');
      }
    });
  }

  // Infinite scroll
  window.addEventListener('scroll', () => {
    if (notifLoading || !notifHasMore) return;

    const scrollPosition = window.innerHeight + window.scrollY;
    const pageHeight = document.documentElement.scrollHeight;

    if (scrollPosition >= pageHeight - 500) {
      loadMoreNotifications();
    }
  });
}

async function loadNotifications(page = 1) {
  const list = document.getElementById('notificationsList');
  const empty = document.getElementById('noNotifications');
  const end = document.getElementById('notifEnd');
  if (!list) return;

  notifLoading = true;

  try {
    const data = await API.notifications.getAll(page);

    if (page === 1) {
      // Remove skeletons
      list.innerHTML = '';
    }

    if (data.success && data.notifications.length > 0) {
      data.notifications.forEach((notif) => {
        list.appendChild(createNotificationElement(notif));
      });

      notifHasMore = data.pagination.hasMore;
      notifPage = page;

      if (empty) empty.style.display = 'none';
      if (end) end.style.display = notifHasMore ? 'none' : 'block';
    } else if (page === 1) {
      if (empty) empty.style.display = 'block';
      if (end) end.style.display = 'none';
    }
  } catch (error) {
    if (page === 1) {
      list.innerHTML = '<div class="empty-state"><p>Failed to load notifications.</p></div>';
    }
  } finally {
    notifLoading = false;
  }
}

function loadMoreNotifications() {
  loadNotifications(notifPage + 1);
}

function createNotificationElement(notif) {
  const div = document.createElement('div');
  div.className = `notification-item ${notif.read ? '' : 'unread'}`;
  div.dataset.notifId = notif._id;

  const sender = notif.sender || {};
  const avatarSrc = sender.avatar || getAvatarUrl(sender.name || 'User');
  const timeAgo = formatDate(notif.createdAt);

  let iconClass = 'fas fa-heart';
  let iconType = 'like';
  let text = '';

  switch (notif.type) {
    case 'like':
      iconClass = 'fas fa-heart';
      iconType = 'like';
      text = `<strong>${escapeHtml(sender.name || 'Someone')}</strong> liked your post`;
      break;
    case 'follow':
      iconClass = 'fas fa-user-plus';
      iconType = 'follow';
      text = `<strong>${escapeHtml(sender.name || 'Someone')}</strong> followed you`;
      break;
    case 'comment':
      iconClass = 'fas fa-comment';
      iconType = 'comment';
      text = `<strong>${escapeHtml(sender.name || 'Someone')}</strong> commented on your post`;
      break;
    default:
      iconClass = 'fas fa-bell';
      iconType = '';
      text = 'You have a new notification';
  }

  div.innerHTML = `
    <div class="notification-icon ${iconType}">
      <i class="${iconClass}"></i>
    </div>
    <div class="notification-content">
      <div class="notification-text">${text}</div>
      <div class="notification-time">${timeAgo}</div>
    </div>
    <img src="${avatarSrc}" alt="" class="notification-avatar"
         onclick="window.location.href='profile.html?id=${sender._id || ''}'" />
  `;

  // Click to mark as read and navigate
  div.addEventListener('click', async () => {
    // Mark as read
    if (!notif.read) {
      try {
        await API.notifications.markRead(notif._id);
        div.classList.remove('unread');
      } catch (e) { /* ignore */ }
    }

    // Navigate based on type
    if (notif.type === 'follow') {
      window.location.href = `profile.html?id=${sender._id}`;
    } else if (notif.post) {
      window.location.href = `feed.html?post=${notif.post._id || notif.post}`;
    }
  });

  return div;
}
