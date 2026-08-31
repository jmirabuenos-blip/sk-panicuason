/* ============================================
   SK BARANGAY PANICUASON — admin-officials.js
   Officials CRUD logic for admin panel.
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

  var allItems  = [];
  var deleteId  = null;
  var editingId = null;

  function initPage(user) {
    userEmail.textContent  = user.email || 'Admin';
    userAvatar.textContent = (user.email || 'A').charAt(0).toUpperCase();
    loadItems();

    db.collection('officials').orderBy('order', 'asc')
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
        '<div class="empty-icon">👥</div>' +
        '<p>No officials yet. Click <strong>"+ Add Official"</strong> to add council members.</p>' +
        '</div>';
      return;
    }

    var rows = allItems.map(function (item) {
      var thumb = item.imageUrl
        ? '<img class="event-thumb" src="' + esc(item.imageUrl) + '" alt="" style="height:48px;width:48px;border-radius:50%;object-fit:cover;" />'
        : '<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;border-radius:50%;">👤</div>';

      var roleBadge = item.isChairman
        ? '<span class="badge" style="background:rgba(14,165,233,.15);color:var(--sky700);">Chairman</span>'
        : '<span class="badge badge-past">Council</span>';

      return '<tr>' +
        '<td>' + thumb + '</td>' +
        '<td><strong>' + esc(item.name || 'Unnamed') + '</strong></td>' +
        '<td>' + esc(item.position || '—') + '</td>' +
        '<td>' + roleBadge + '</td>' +
        '<td>' + (item.order != null ? item.order : '—') + '</td>' +
        '<td>' +
          '<div class="action-btns">' +
            '<button class="btn-edit" onclick="OfficialsAdmin.edit(\'' + item.id + '\')">Edit</button>' +
            '<button class="btn-delete" onclick="OfficialsAdmin.confirmDelete(\'' + item.id + '\')">Delete</button>' +
          '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    tableContainer.innerHTML =
      '<table class="admin-table">' +
      '<thead><tr>' +
        '<th style="width:60px;"></th>' +
        '<th>Name</th>' +
        '<th>Position</th>' +
        '<th>Role</th>' +
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
    chairmanInput.checked = false;

    if (data) {
      editingId = data.id;
      modalTitle.textContent = 'Edit Official';
      idInput.value         = data.id;
      nameInput.value       = data.name || '';
      positionInput.value   = data.position || '';
      imageInput.value      = data.imageUrl || '';
      bioInput.value        = data.bio || '';
      orderInput.value      = data.order != null ? data.order : 0;
      chairmanInput.checked = !!data.isChairman;
      if (data.imageUrl) {
        imagePreview.src = data.imageUrl;
        imagePreview.style.display = 'block';
      }
    } else {
      modalTitle.textContent = 'Add New Official';
      idInput.value = '';
      orderInput.value = allItems.length;
    }
    modal.classList.add('show');
  }

  function closeModal() { modal.classList.remove('show'); }

  modalSave.addEventListener('click', async function () {
    var name = nameInput.value.trim();
    if (!name) { showToast('Please enter a name.', 'error'); return; }

    modalSave.disabled = true;
    modalSave.textContent = 'Saving…';

    try {
      var payload = {
        name:        name,
        position:    positionInput.value.trim(),
        imageUrl:    imageInput.value.trim() || null,
        bio:         bioInput.value.trim(),
        order:       parseInt(orderInput.value, 10) || 0,
        isChairman:  chairmanInput.checked,
        updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingId) {
        await db.collection('officials').doc(editingId).update(payload);
        showToast('Official updated!', 'success');
      } else {
        payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('officials').add(payload);
        showToast('Official added!', 'success');
      }
      closeModal();
    } catch (err) {
      showToast('Error: ' + err.message, 'error');
    } finally {
      modalSave.disabled = false;
      modalSave.textContent = 'Save Official';
    }
  });

  imageInput.addEventListener('input', function () {
    var url = imageInput.value.trim();
    if (url) { imagePreview.src = url; imagePreview.style.display = 'block'; }
    else { imagePreview.style.display = 'none'; }
  });

  function confirmDeleteItem(id) { deleteId = id; confirmModal.classList.add('show'); }

  confirmDeleteBtn.addEventListener('click', async function () {
    if (!deleteId) return;
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting…';
    try {
      await db.collection('officials').doc(deleteId).delete();
      showToast('Official removed.', 'success');
    } catch (err) { showToast('Error: ' + err.message, 'error'); }
    finally {
      deleteId = null;
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Delete';
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

  window.OfficialsAdmin = { edit: editItem, confirmDelete: confirmDeleteItem };
})();
