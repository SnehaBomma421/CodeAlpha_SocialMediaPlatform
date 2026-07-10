/**
 * SocialSphere — Create Post Script
 * Handles post creation with image upload and caption
 */

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('createPostForm');
  if (!form) return;

  initCreatePost();
});

function initCreatePost() {
  const imageInput = document.getElementById('postImageInput');
  const uploadArea = document.getElementById('postImageUpload');
  const uploadPlaceholder = document.getElementById('uploadPlaceholder');
  const uploadPreview = document.getElementById('uploadPreview');
  const previewImage = document.getElementById('previewImage');
  const removeBtn = document.getElementById('removeImageBtn');
  const captionInput = document.getElementById('caption');
  const captionCount = document.getElementById('captionCount');

  // Click to upload
  if (uploadArea && imageInput) {
    uploadArea.addEventListener('click', (e) => {
      // Don't trigger if clicking on remove button
      if (e.target.closest('.remove-image-btn')) return;
      imageInput.click();
    });
  }

  // Image selected
  if (imageInput) {
    imageInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) {
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showToast('File too large. Maximum size is 5MB.', 'error');
          imageInput.value = '';
          return;
        }

        // Validate file type
        if (!['image/jpeg', 'image/png', 'image/gif', 'image/webp'].includes(file.type)) {
          showToast('Please select a valid image file (JPEG, PNG, GIF, WebP)', 'error');
          imageInput.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          if (previewImage) previewImage.src = event.target.result;
          if (uploadPlaceholder) uploadPlaceholder.style.display = 'none';
          if (uploadPreview) uploadPreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  // Remove image
  if (removeBtn && imageInput) {
    removeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      imageInput.value = '';
      if (uploadPlaceholder) uploadPlaceholder.style.display = 'flex';
      if (uploadPreview) uploadPreview.style.display = 'none';
      if (previewImage) previewImage.src = '';
    });
  }

  // Caption character count
  if (captionInput && captionCount) {
    captionInput.addEventListener('input', () => {
      captionCount.textContent = captionInput.value.length;
    });
  }

  // Submit form
  const form = document.getElementById('createPostForm');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const caption = captionInput ? captionInput.value.trim() : '';
    const btn = document.getElementById('createPostBtn');

    // Validate — at least one of caption or image
    if (!caption && (!imageInput || !imageInput.files[0])) {
      showToast('Add a caption or image to create a post', 'error');
      return;
    }

    setButtonLoading(btn, true);

    try {
      const formData = new FormData();
      formData.append('caption', caption);

      if (imageInput && imageInput.files[0]) {
        formData.append('image', imageInput.files[0]);
      }

      const data = await API.posts.create(formData);

      if (data.success) {
        showToast('Post shared successfully!', 'success');
        setTimeout(() => {
          window.location.href = 'feed.html';
        }, 800);
      }
    } catch (error) {
      showToast(error.message || 'Failed to create post', 'error');
    } finally {
      setButtonLoading(btn, false);
    }
  });
}
