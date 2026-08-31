/* ============================================
   SK BARANGAY PANICUASON — admin-gallery.js
   Gallery CRUD logic for admin panel.
   Depends on firebase-config.js & admin-auth.js
============================================ */

(function () {
  'use strict';

  AdminAuth.protectPage('login.html').then(function (user) {
    initPage(user);
  });

  var sidebar        = document.getElementById('adminSidebar');
  var sidebarToggle  = document.getElementById('sidebarToggle');
  var logoutBtn      = document.getElementById('logoutBtn');
  var userEmail      = document.getElementById('userEmail');
  var userAvatar     = document.getElementById('userAvatar');
  var btnAdd         = document.getElementById('btnAddPhoto');
  var tableContainer = document.getElementById('galleryTableContainer');

  var modal          = document.getElementById('photoModal');
  var modalTitle     = document.getElementById('modalTitle');
  var modalClose     = document.getElementById('modalClose');
  var modalCancel    = document.getElementById('modalCancel');
  var modalSave      = document.getElementById('modalSave');
  var form           = document.getElementById('photoForm');
  var idInput        = document.getElementById('photoId');
  var titleInput     = document.getElementById('photoTitle');
  var captionInput   = document.getElementById('photoCaption');
  var categoryInput  = document.getElementById('photoCategory');
  var imageInput     = document.getElementById('photoImage');
  var imagePreview   = document.getElementById('imagePreview');
  var orderInput     = document.getElementById('photoOrder');

  var confirmModal   = document.getElementById('confirmModal');
  var confirmCancel  = document.getElementById('confirmCancel');
  var confirmDelete  = document.getElementById('confirmDelete');

  var allItems  = [];
  var deleteId  = null;
  var editingId = null;

  function initPage(user) {
    userEmail.textContent  = user.email || 'Admin';
    userAvatar.textContent = (user.email || 'A').charAt(0).toUpperCase();
    loadItems();

    db.collection('gallery').orderBy('order', 'asc')
      .onSnapshot(function (snap) {
        allItems = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        renderTable();
      });
  }

  function loadItems() {
    tableContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  }

  function renderTable() {
    if (allItems.length === 0) {
      tableContainer.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">🖼️</div>' +
        '<p>No photos yet. Click <strong>"+ Add Photo"</strong> to add your first one.</p>' +
        '</div>';
      return;
    }

    var rows = allItems.map(function (item) {
      var thumb = item.imageUrl
        ? '<img class="event-thumb" src="' + esc(item.imageUrl) + '" alt="" style="height:48px;width:64px;" />'
        : '<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">🖼️</div>';

      var catBadge = item.category
        ? '<span class="badge badge-upcoming">' + esc(item.category) + '</span>'
        : '<span class="badge badge-past">Uncategorized</span>';

      return '<tr>' +
        '<td>' + thumb + '</td>' +
        '<td><strong>' + esc(item.title || 'Untitled') + '</strong></td>' +
        '<td>' + esc(item.caption || '—') + '</td>' +
        '<td>' + catBadge + '</td>' +
        '<td>' + (item.order != null ? item.order : '—') + '</td>' +
        '<td>' +
          '<div class="action-btns">' +
            '<button class="btn-edit" onclick="GalleryAdmin.edit(\'' + item.id + '\')">Edit</button>' +
            '<button class="btn-delete" onclick="GalleryAdmin.confirmDelete(\'' + item.id + '\')">Delete</button>' +
          '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    tableContainer.innerHTML =
      '<table class="admin-table">' +
      '<thead><tr>' +
        '<th style="width:80px;"></th>' +
        '<th>Title</th>' +
        '<th>Caption</th>' +
        '<th>Category</th>' +
        '<th>Order</th>' +
        '<th style="width:140px;">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  function openModal(data) {
    form.reset();
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    editingId = null;

    if (data) {
      editingId = data.id;
      modalTitle.textContent = 'Edit Photo';
      idInput.value       = data.id;
      titleInput.value    = data.title || '';
      captionInput.value  = data.caption || '';
      categoryInput.value = data.category || '';
      imageInput.value    = data.imageUrl || '';
      orderInput.value    = data.order != null ? data.order : 0;
      if (data.imageUrl) {
        imagePreview.src = data.imageUrl;
        imagePreview.style.display = 'block';
      }
    } else {
      modalTitle.textContent = 'Add New Photo';
      idInput.value = '';
      orderInput.value = allItems.length;
    }
    modal.classList.add('show');
  }

  function closeModal() { modal.classList.remove('show'); }

  modalSave.addEventListener('click', async function () {
    var title = titleInput.value.trim();
    if (!title) { showToast('Please enter a title.', 'error'); return; }
    if (!imageInput.value.trim()) { showToast('Please enter an image URL.', 'error'); return; }

    modalSave.disabled = true;
    modalSave.textContent = 'Saving…';

    try {
      var payload = {
        title:     title,
        caption:   captionInput.value.trim(),
        category:  categoryInput.value.trim(),
        imageUrl:  imageInput.value.trim() || null,
        order:     parseInt(orderInput.value, 10) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingId) {
        await db.collection('gallery').doc(editingId).update(payload);
        showToast('Photo updated!', 'success');
      } else {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('gallery').add(payload);
        showToast('Photo added!', 'success');
      }
      closeModal();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      modalSave.disabled = false;
      modalSave.textContent = 'Save Photo';
    }
  });

  imageInput.addEventListener('input', function () {
    var url = imageInput.value.trim();
    if (url) { imagePreview.src = url; imagePreview.style.display = 'block'; }
    else { imagePreview.style.display = 'none'; }
  });

  function confirmDeleteItem(id) { deleteId = id; confirmModal.classList.add('show'); }

  confirmDelete.addEventListener('click', async function () {
    if (!deleteId) return;
    confirmDelete.disabled = true;
    confirmDelete.textContent = 'Deleting…';
    try {
      await db.collection('gallery').doc(deleteId).delete();
      showToast('Photo deleted.', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
    finally {
      deleteId = null;
      confirmDelete.disabled = false;
      confirmDelete.textContent = 'Delete';
      confirmModal.classList.remove('show');
    }
  });

  confirmCancel.addEventListener('click', function () { deleteId = null; confirmModal.classList.remove('show'); });

  function editItem(id) {
    var item = allItems.find(function (i) { return i.id === id; });
    if (item) openModal(item);
  }

  btnAdd.addEventListener('click', function () { openModal(null); });
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  confirmModal.addEventListener('click', function (e) { if (e.target === confirmModal) { deleteId = null; confirmModal.classList.remove('show'); } });
  sidebarToggle.addEventListener('click', function () { sidebar.classList.toggle('open'); });
  logoutBtn.addEventListener('click', function () { AdminAuth.signOut().then(function () { window.location.href = 'login.html'; }); });

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 300); }, 3500);
  }

  window.GalleryAdmin = { edit: editItem, confirmDelete: confirmDeleteItem };
})();
