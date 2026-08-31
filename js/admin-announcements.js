/* ============================================
   SK BARANGAY PANICUASON — admin-announcements.js
   Announcement CRUD + Dashboard logic.
   Depends on firebase-config.js & admin-auth.js
============================================ */

(function () {
  'use strict';

  /* ── Protect this page ── */
  AdminAuth.protectPage('login.html').then(function (user) {
    initPage(user);
  });

  /* ── DOM refs ── */
  var sidebar        = document.getElementById('adminSidebar');
  var sidebarToggle  = document.getElementById('sidebarToggle');
  var logoutBtn      = document.getElementById('logoutBtn');
  var userEmail      = document.getElementById('userEmail');
  var userAvatar     = document.getElementById('userAvatar');
  var btnAdd         = document.getElementById('btnAddAnnouncement');
  var tableContainer = document.getElementById('announcementsTableContainer');

  /* ── Modal refs ── */
  var modal          = document.getElementById('announcementModal');
  var modalTitle     = document.getElementById('modalTitle');
  var modalClose     = document.getElementById('modalClose');
  var modalCancel    = document.getElementById('modalCancel');
  var modalSave      = document.getElementById('modalSave');
  var form           = document.getElementById('announcementForm');
  var idInput        = document.getElementById('announcementId');
  var titleInput     = document.getElementById('annTitle');
  var tagInput       = document.getElementById('annTag');
  var tagColorInput  = document.getElementById('annTagColor');
  var contentInput   = document.getElementById('annContent');
  var imageInput     = document.getElementById('annImage');
  var imageFile      = document.getElementById('annImageFile');
  var imagePreview   = document.getElementById('imagePreview');
  var linkUrlInput   = document.getElementById('annLinkUrl');
  var linkTextInput  = document.getElementById('annLinkText');
  var activeInput    = document.getElementById('annActive');
  var orderInput     = document.getElementById('annOrder');

  /* ── Confirm modal ── */
  var confirmModal   = document.getElementById('confirmModal');
  var confirmCancel  = document.getElementById('confirmCancel');
  var confirmDelete  = document.getElementById('confirmDelete');

  /* ── State ── */
  var allItems  = [];
  var deleteId  = null;
  var editingId = null;
  var uploadTask = null;

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function initPage(user) {
    userEmail.textContent  = user.email || 'Admin';
    userAvatar.textContent = (user.email || 'A').charAt(0).toUpperCase();
    loadItems();

    db.collection('announcements').orderBy('order', 'asc')
      .onSnapshot(function (snap) {
        allItems = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        renderTable();
      });
  }

  /* ═══════════════════════════════════════════
     LOAD (initial placeholder)
  ═══════════════════════════════════════════ */
  function loadItems() {
    tableContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  }

  /* ═══════════════════════════════════════════
     RENDER TABLE
  ═══════════════════════════════════════════ */
  function renderTable() {
    if (allItems.length === 0) {
      tableContainer.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">📢</div>' +
        '<p>No announcements yet. Click <strong>"+ Add Announcement"</strong> to create your first one.</p>' +
        '</div>';
      return;
    }

    var rows = allItems.map(function (item) {
      var thumb = item.imageUrl
        ? '<img class="event-thumb" src="' + esc(item.imageUrl) + '" alt="" />'
        : '<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📢</div>';

      var tagStyle = 'background:' + (item.tagColor || 'var(--offwhite)') + ';color:' + (item.tagColor ? '#fff' : 'var(--navy)') + ';';
      var tagHtml  = item.tag
        ? '<span class="badge" style="' + tagStyle + '">' + esc(item.tag) + '</span>'
        : '<span class="badge badge-past">No Tag</span>';

      var activeBadge = item.active === false
        ? '<span class="badge badge-past">Hidden</span>'
        : '<span class="badge badge-upcoming">Active</span>';

      return '<tr>' +
        '<td>' + thumb + '</td>' +
        '<td><strong>' + esc(item.title || 'Untitled') + '</strong></td>' +
        '<td>' + tagHtml + '</td>' +
        '<td>' + activeBadge + '</td>' +
        '<td>' + (item.order != null ? item.order : '—') + '</td>' +
        '<td>' +
          '<div class="action-btns">' +
            '<button class="btn-edit" onclick="AnnouncementAdmin.edit(\'' + item.id + '\')">Edit</button>' +
            '<button class="btn-delete" onclick="AnnouncementAdmin.confirmDelete(\'' + item.id + '\')">Delete</button>' +
          '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    tableContainer.innerHTML =
      '<table class="admin-table">' +
      '<thead><tr>' +
        '<th style="width:70px;"></th>' +
        '<th>Title</th>' +
        '<th>Tag</th>' +
        '<th>Status</th>' +
        '<th>Order</th>' +
        '<th style="width:140px;">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  /* ═══════════════════════════════════════════
     MODAL OPEN / CLOSE
  ═══════════════════════════════════════════ */
  function openModal(data) {
    form.reset();
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    editingId = null;
    activeInput.checked = true;

    if (data) {
      editingId = data.id;
      modalTitle.textContent = 'Edit Announcement';
      idInput.value        = data.id;
      titleInput.value     = data.title || '';
      tagInput.value       = data.tag || '';
      tagColorInput.value  = data.tagColor || '#0d6efd';
      contentInput.value   = data.content || '';
      imageInput.value     = data.imageUrl || '';
      linkUrlInput.value   = data.linkUrl || '';
      linkTextInput.value  = data.linkText || '';
      activeInput.checked  = data.active !== false;
      orderInput.value     = data.order != null ? data.order : 0;

      if (data.imageUrl) {
        imagePreview.src = data.imageUrl;
        imagePreview.style.display = 'block';
      }
    } else {
      modalTitle.textContent = 'Add New Announcement';
      idInput.value = '';
      orderInput.value = allItems.length;
    }

    modal.classList.add('show');
  }

  function closeModal() {
    modal.classList.remove('show');
    if (uploadTask) { uploadTask.cancel(); uploadTask = null; }
  }

  /* ═══════════════════════════════════════════
     SAVE (Create / Update)
  ═══════════════════════════════════════════ */
  modalSave.addEventListener('click', async function () {
    var title = titleInput.value.trim();
    if (!title) {
      showToast('Please enter a title.', 'error');
      return;
    }

    modalSave.disabled = true;
    modalSave.textContent = 'Saving…';

    try {
      var imageUrl = imageInput.value.trim();

      if (imageFile.files.length > 0) {
        try {
          imageUrl = await uploadImage(imageFile.files[0]);
        } catch (uploadErr) {
          console.warn('Image upload failed (Storage may not be enabled):', uploadErr);
          showToast('Image upload unavailable — using URL instead. Paste an image URL above.', 'error');
          imageFile.value = '';
        }
      }

      var payload = {
        title:     title,
        tag:       tagInput.value.trim(),
        tagColor:  tagColorInput.value || '#0d6efd',
        content:   contentInput.value.trim(),
        imageUrl:  imageUrl || null,
        linkUrl:   linkUrlInput.value.trim() || null,
        linkText:  linkTextInput.value.trim() || null,
        active:    activeInput.checked,
        order:     parseInt(orderInput.value, 10) || 0,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingId) {
        await db.collection('announcements').doc(editingId).update(payload);
        showToast('Announcement updated!', 'success');
      } else {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('announcements').add(payload);
        showToast('Announcement created!', 'success');
      }

      closeModal();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Error: ' + err.message, 'error');
    } finally {
      modalSave.disabled = false;
      modalSave.textContent = 'Save Announcement';
    }
  });

  /* ═══════════════════════════════════════════
     IMAGE UPLOAD
  ═══════════════════════════════════════════ */
  function uploadImage(file) {
    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () {
        reject(new Error('Upload timed out — Firebase Storage may not be enabled'));
      }, 10000);

      var name = 'announcements/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var ref  = storage.ref(name);
      uploadTask = ref.put(file);
      uploadTask.on('state_changed', null,
        function (err) { clearTimeout(timeout); reject(err); },
        async function () {
          clearTimeout(timeout);
          var url = await ref.getDownloadURL();
          uploadTask = null;
          resolve(url);
        }
      );
    });
  }

  /* ── Image preview ── */
  imageFile.addEventListener('change', function (e) {
    var file = e.target.files[0];
    if (file) {
      var reader = new FileReader();
      reader.onload = function (ev) {
        imagePreview.src = ev.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  imageInput.addEventListener('input', function () {
    var url = imageInput.value.trim();
    if (url) {
      imagePreview.src = url;
      imagePreview.style.display = 'block';
    } else {
      imagePreview.style.display = 'none';
    }
  });

  /* ═══════════════════════════════════════════
     DELETE
  ═══════════════════════════════════════════ */
  function confirmDeleteItem(id) {
    deleteId = id;
    confirmModal.classList.add('show');
  }

  confirmDelete.addEventListener('click', async function () {
    if (!deleteId) return;
    confirmDelete.disabled = true;
    confirmDelete.textContent = 'Deleting…';
    try {
      await db.collection('announcements').doc(deleteId).delete();
      showToast('Announcement deleted.', 'success');
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      deleteId = null;
      confirmDelete.disabled = false;
      confirmDelete.textContent = 'Delete';
      confirmModal.classList.remove('show');
    }
  });

  confirmCancel.addEventListener('click', function () {
    deleteId = null;
    confirmModal.classList.remove('show');
  });

  /* ═══════════════════════════════════════════
     EDIT
  ═══════════════════════════════════════════ */
  function editItem(id) {
    var item = allItems.find(function (i) { return i.id === id; });
    if (item) openModal(item);
  }

  /* ═══════════════════════════════════════════
     EVENT LISTENERS
  ═══════════════════════════════════════════ */
  btnAdd.addEventListener('click', function () { openModal(null); });
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  confirmModal.addEventListener('click', function (e) {
    if (e.target === confirmModal) { deleteId = null; confirmModal.classList.remove('show'); }
  });

  sidebarToggle.addEventListener('click', function () { sidebar.classList.toggle('open'); });
  logoutBtn.addEventListener('click', function () {
    AdminAuth.signOut().then(function () { window.location.href = 'login.html'; });
  });

  /* ═══════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════ */
  function esc(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(msg, type) {
    var c = document.getElementById('toastContainer');
    var t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    c.appendChild(t);
    setTimeout(function () {
      t.style.opacity = '0';
      t.style.transition = 'opacity .3s';
      setTimeout(function () { t.remove(); }, 300);
    }, 3500);
  }

  /* ── Expose for inline onclick ── */
  window.AnnouncementAdmin = {
    edit:        editItem,
    confirmDelete: confirmDeleteItem
  };

})();
