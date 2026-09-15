/* ============================================
   SK ADMIN — admin-announcements.js
   Announcement CRUD for top-nav admin layout
============================================ */

(function () {
  'use strict';

  AdminAuth.protectPage('login.html').then(function (user) {
    initPage(user);
  });

  var logoutBtn      = document.getElementById('logoutBtn');
  var userEmail      = document.getElementById('userEmail');
  var userAvatar     = document.getElementById('userAvatar');
  var btnAdd         = document.getElementById('btnAddAnnouncement');
  var tableContainer = document.getElementById('announcementsTableContainer');

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

  var confirmModal   = document.getElementById('confirmModal');
  var confirmCancel  = document.getElementById('confirmCancel');
  var confirmDelete  = document.getElementById('confirmDelete');

  var allItems  = [];
  var deleteId  = null;
  var editingId = null;
  var uploadTask = null;

  function initPage(user) {
    var name = user.email || 'Admin';
    if (userEmail) userEmail.textContent = name;
    if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();

    loadItems();

    db.collection('announcements').orderBy('order', 'asc')
      .onSnapshot(function (snap) {
        allItems = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        renderTable();
      });
  }

  function loadItems() {
    if (tableContainer) tableContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  }

  function renderTable() {
    if (!tableContainer) return;
    if (allItems.length === 0) {
      tableContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128227;</div><p>No announcements yet.</p></div>';
      return;
    }

    var rows = allItems.map(function (item) {
      var thumb = item.imageUrl
        ? '<img class="event-thumb" src="' + esc(item.imageUrl) + '" alt="" />'
        : '<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);">&#128227;</div>';
      var tagStyle = 'background:' + (item.tagColor || '#f1f5f9') + ';color:' + (item.tagColor ? '#fff' : 'var(--admin-text)') + ';';
      var tagHtml = item.tag
        ? '<span class="badge" style="' + tagStyle + '">' + esc(item.tag) + '</span>'
        : '<span class="badge badge-past">No Tag</span>';
      var activeBadge = item.active === false
        ? '<span class="badge badge-past">Hidden</span>'
        : '<span class="badge badge-upcoming">Active</span>';

      return '<tr><td>' + thumb + '</td><td><strong>' + esc(item.title || 'Untitled') + '</strong></td><td>' + tagHtml + '</td><td>' + activeBadge + '</td><td>' + (item.order != null ? item.order : '—') + '</td><td><div class="action-btns"><button class="btn-edit" onclick="AnnouncementAdmin.edit(\'' + item.id + '\')">Edit</button><button class="btn-delete" onclick="AnnouncementAdmin.confirmDelete(\'' + item.id + '\')">Delete</button></div></td></tr>';
    }).join('');

    tableContainer.innerHTML = '<table class="admin-table"><thead><tr><th style="width:60px;"></th><th>Title</th><th>Tag</th><th>Status</th><th>Order</th><th style="width:120px;">Actions</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function openModal(data) {
    if (!form) return;
    form.reset();
    if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.src = ''; }
    editingId = null;
    if (activeInput) activeInput.checked = true;

    if (data) {
      editingId = data.id;
      if (modalTitle) modalTitle.textContent = 'Edit Announcement';
      if (idInput) idInput.value = data.id;
      if (titleInput) titleInput.value = data.title || '';
      if (tagInput) tagInput.value = data.tag || '';
      if (tagColorInput) tagColorInput.value = data.tagColor || '#0d6efd';
      if (contentInput) contentInput.value = data.content || '';
      if (imageInput) imageInput.value = data.imageUrl || '';
      if (linkUrlInput) linkUrlInput.value = data.linkUrl || '';
      if (linkTextInput) linkTextInput.value = data.linkText || '';
      if (activeInput) activeInput.checked = data.active !== false;
      if (orderInput) orderInput.value = data.order != null ? data.order : 0;
      if (data.imageUrl && imagePreview) { imagePreview.src = data.imageUrl; imagePreview.style.display = 'block'; }
    } else {
      if (modalTitle) modalTitle.textContent = 'Add New Announcement';
      if (idInput) idInput.value = '';
      if (orderInput) orderInput.value = allItems.length;
    }
    if (modal) modal.classList.add('show');
  }

  function closeModal() {
    if (modal) modal.classList.remove('show');
    if (uploadTask) { try { uploadTask.cancel(); } catch(e){} uploadTask = null; }
  }

  if (modalSave) {
    modalSave.addEventListener('click', async function () {
      var title = titleInput ? titleInput.value.trim() : '';
      if (!title) { showToast('Please enter a title.', 'error'); return; }
      modalSave.disabled = true;
      modalSave.textContent = 'Saving…';
      try {
        var imageUrl = imageInput ? imageInput.value.trim() : '';
        if (imageFile && imageFile.files.length > 0) {
          try { imageUrl = await uploadImage(imageFile.files[0]); }
          catch (e) { showToast('Image upload unavailable.', 'error'); imageFile.value = ''; }
        }
        var payload = {
          title: title, tag: tagInput ? tagInput.value.trim() : '',
          tagColor: tagColorInput ? tagColorInput.value : '#0d6efd',
          content: contentInput ? contentInput.value.trim() : '',
          imageUrl: imageUrl || null,
          linkUrl: linkUrlInput ? linkUrlInput.value.trim() || null : null,
          linkText: linkTextInput ? linkTextInput.value.trim() || null : null,
          active: activeInput ? activeInput.checked : true,
          order: orderInput ? parseInt(orderInput.value, 10) || 0 : 0,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (editingId) { await db.collection('announcements').doc(editingId).update(payload); showToast('Announcement updated!', 'success'); }
        else { payload.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('announcements').add(payload); showToast('Announcement created!', 'success'); }
        closeModal();
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
      finally { modalSave.disabled = false; modalSave.textContent = 'Save Announcement'; }
    });
  }

  function uploadImage(file) {
    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () { reject(new Error('Upload timed out')); }, 10000);
      var name = 'announcements/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var ref = storage.ref(name);
      uploadTask = ref.put(file);
      uploadTask.on('state_changed', null, function (e) { clearTimeout(timeout); reject(e); },
        async function () { clearTimeout(timeout); var url = await ref.getDownloadURL(); uploadTask = null; resolve(url); });
    });
  }

  if (imageFile) {
    imageFile.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (file && imagePreview) { var r = new FileReader(); r.onload = function (ev) { imagePreview.src = ev.target.result; imagePreview.style.display = 'block'; }; r.readAsDataURL(file); }
    });
  }
  if (imageInput) {
    imageInput.addEventListener('input', function () {
      var url = imageInput.value.trim();
      if (url && imagePreview) { imagePreview.src = url; imagePreview.style.display = 'block'; }
      else if (imagePreview) { imagePreview.style.display = 'none'; }
    });
  }

  function confirmDeleteItem(id) { deleteId = id; if (confirmModal) confirmModal.classList.add('show'); }

  if (confirmDelete) {
    confirmDelete.addEventListener('click', async function () {
      if (!deleteId) return;
      confirmDelete.disabled = true; confirmDelete.textContent = 'Deleting…';
      try { await db.collection('announcements').doc(deleteId).delete(); showToast('Announcement deleted.', 'success'); }
      catch (err) { showToast('Error: ' + err.message, 'error'); }
      finally { deleteId = null; confirmDelete.disabled = false; confirmDelete.textContent = 'Delete'; if (confirmModal) confirmModal.classList.remove('show'); }
    });
  }
  if (confirmCancel) confirmCancel.addEventListener('click', function () { deleteId = null; if (confirmModal) confirmModal.classList.remove('show'); });

  function editItem(id) { var item = allItems.find(function (i) { return i.id === id; }); if (item) openModal(item); }

  if (btnAdd) btnAdd.addEventListener('click', function () { openModal(null); });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  if (modal) modal.addEventListener('click', function (e) { if (e.target === modal) closeModal(); });
  if (confirmModal) confirmModal.addEventListener('click', function (e) { if (e.target === confirmModal) { deleteId = null; confirmModal.classList.remove('show'); } });
  if (logoutBtn) logoutBtn.addEventListener('click', function () { AdminAuth.signOut().then(function () { window.location.href = 'login.html'; }); });

  function esc(str) { var d = document.createElement('div'); d.textContent = str; return d.innerHTML; }
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer'); if (!c) return;
    var t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; c.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 300); }, 3500);
  }

  window.AnnouncementAdmin = { edit: editItem, confirmDelete: confirmDeleteItem };

})();
