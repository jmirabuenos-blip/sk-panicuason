/* ============================================
   SK ADMIN — admin-officials.js
   Officials CRUD for top-nav admin layout
============================================ */

(function () {
  'use strict';

  AdminAuth.protectPage('login.html').then(function (user) { initPage(user); });

  var logoutBtn      = document.getElementById('logoutBtn');
  var userEmail      = document.getElementById('userEmail');
  var userAvatar     = document.getElementById('userAvatar');
  var btnAdd         = document.getElementById('btnAddOfficial');
  var tableContainer = document.getElementById('officialsTableContainer');

  var modal          = document.getElementById('officialModal');
  var modalTitle     = document.getElementById('modalTitle');
  var modalClose     = document.getElementById('modalClose');
  var modalCancel    = document.getElementById('modalCancel');
  var modalSave      = document.getElementById('modalSave');
  var form           = document.getElementById('officialForm');
  var idInput        = document.getElementById('officialId');
  var nameInput      = document.getElementById('officialName');
  var positionInput  = document.getElementById('officialPosition');
  var imageInput     = document.getElementById('officialImage');
  var imagePreview   = document.getElementById('imagePreview');
  var bioInput       = document.getElementById('officialBio');
  var orderInput     = document.getElementById('officialOrder');
  var chairmanInput  = document.getElementById('officialChairman');

  var confirmModal   = document.getElementById('confirmModal');
  var confirmCancel  = document.getElementById('confirmCancel');
  var confirmDeleteBtn = document.getElementById('confirmDelete');

  var allItems = [], deleteId = null, editingId = null;

  function initPage(user) {
    var name = user.email || 'Admin';
    if (userEmail) userEmail.textContent = name;
    if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();
    loadItems();
    db.collection('officials').orderBy('order', 'asc').onSnapshot(function (snap) {
      allItems = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      renderTable();
    });
  }

  function loadItems() { if (tableContainer) tableContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>'; }

  function renderTable() {
    if (!tableContainer) return;
    if (allItems.length === 0) { tableContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128101;</div><p>No officials yet.</p></div>'; return; }
    var rows = allItems.map(function (item) {
      var thumb = item.imageUrl
        ? '<img class="event-thumb" src="' + esc(item.imageUrl) + '" alt="" style="height:44px;width:44px;border-radius:50%;object-fit:cover;" />'
        : '<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);border-radius:50%;">&#128100;</div>';
      var roleBadge = item.isChairman ? '<span class="badge badge-upcoming">Chairman</span>' : '<span class="badge badge-past">Council</span>';
      return '<tr><td>' + thumb + '</td><td><strong>' + esc(item.name || 'Unnamed') + '</strong></td><td>' + esc(item.position || '—') + '</td><td>' + roleBadge + '</td><td>' + (item.order != null ? item.order : '—') + '</td><td><div class="action-btns"><button class="btn-edit" onclick="OfficialsAdmin.edit(\'' + item.id + '\')">Edit</button><button class="btn-delete" onclick="OfficialsAdmin.confirmDelete(\'' + item.id + '\')">Delete</button></div></td></tr>';
    }).join('');
    tableContainer.innerHTML = '<table class="admin-table"><thead><tr><th style="width:60px;"></th><th>Name</th><th>Position</th><th>Role</th><th>Order</th><th style="width:120px;">Actions</th></tr></thead><tbody>' + rows + '</tbody></table>';
  }

  function openModal(data) {
    if (!form) return; form.reset();
    if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.src = ''; }
    editingId = null;
    if (chairmanInput) chairmanInput.checked = false;
    if (data) { editingId = data.id; if (modalTitle) modalTitle.textContent = 'Edit Official'; if (idInput) idInput.value = data.id; if (nameInput) nameInput.value = data.name || ''; if (positionInput) positionInput.value = data.position || ''; if (imageInput) imageInput.value = data.imageUrl || ''; if (bioInput) bioInput.value = data.bio || ''; if (orderInput) orderInput.value = data.order != null ? data.order : 0; if (chairmanInput) chairmanInput.checked = !!data.isChairman; if (data.imageUrl && imagePreview) { imagePreview.src = data.imageUrl; imagePreview.style.display = 'block'; } }
    else { if (modalTitle) modalTitle.textContent = 'Add New Official'; if (idInput) idInput.value = ''; if (orderInput) orderInput.value = allItems.length; }
    if (modal) modal.classList.add('show');
  }
  function closeModal() { if (modal) modal.classList.remove('show'); }

  if (modalSave) {
    modalSave.addEventListener('click', async function () {
      var name = nameInput ? nameInput.value.trim() : '';
      if (!name) { showToast('Please enter a name.', 'error'); return; }
      modalSave.disabled = true; modalSave.textContent = 'Saving…';
      try {
        var payload = { name: name, position: positionInput ? positionInput.value.trim() : '', imageUrl: imageInput ? imageInput.value.trim() || null : null, bio: bioInput ? bioInput.value.trim() : '', order: orderInput ? parseInt(orderInput.value, 10) || 0 : 0, isChairman: chairmanInput ? chairmanInput.checked : false, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        if (editingId) { await db.collection('officials').doc(editingId).update(payload); showToast('Official updated!', 'success'); }
        else { payload.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('officials').add(payload); showToast('Official added!', 'success'); }
        closeModal();
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
      finally { modalSave.disabled = false; modalSave.textContent = 'Save Official'; }
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
  if (confirmDeleteBtn) {
    confirmDeleteBtn.addEventListener('click', async function () {
      if (!deleteId) return; confirmDeleteBtn.disabled = true; confirmDeleteBtn.textContent = 'Deleting…';
      try { await db.collection('officials').doc(deleteId).delete(); showToast('Official removed.', 'success'); }
      catch (err) { showToast('Error: ' + err.message, 'error'); }
      finally { deleteId = null; confirmDeleteBtn.disabled = false; confirmDeleteBtn.textContent = 'Delete'; if (confirmModal) confirmModal.classList.remove('show'); }
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

  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer'); if (!c) return;
    var t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; c.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 300); }, 3500);
  }
  window.OfficialsAdmin = { edit: editItem, confirmDelete: confirmDeleteItem };
})();
