/* ============================================
   SK BARANGAY PANICUASON — admin-events.js
   Event CRUD + Dashboard logic for admin panel.
   Depends on firebase-config.js & admin-auth.js
============================================ */

(function () {
  'use strict';

  /* ── Protect this page ── */
  AdminAuth.protectPage('login.html').then((user) => {
    initDashboard(user);
  });

  /* ── DOM refs ── */
  const sidebar        = document.getElementById('adminSidebar');
  const sidebarToggle  = document.getElementById('sidebarToggle');
  const logoutBtn      = document.getElementById('logoutBtn');
  const userEmail      = document.getElementById('userEmail');
  const userAvatar     = document.getElementById('userAvatar');
  const btnAddEvent    = document.getElementById('btnAddEvent');
  const tableContainer = document.getElementById('eventsTableContainer');

  /* ── Modal refs ── */
  const eventModal   = document.getElementById('eventModal');
  const modalTitle   = document.getElementById('modalTitle');
  const modalClose   = document.getElementById('modalClose');
  const modalCancel  = document.getElementById('modalCancel');
  const modalSave    = document.getElementById('modalSave');
  const eventForm    = document.getElementById('eventForm');
  const eventIdInput = document.getElementById('eventId');
  const titleInput   = document.getElementById('eventTitle');
  const descInput    = document.getElementById('eventDescription');
  const dateInput    = document.getElementById('eventDate');
  const timeInput    = document.getElementById('eventTime');
  const locInput     = document.getElementById('eventLocation');
  const imageInput   = document.getElementById('eventImage');
  const imageFile    = document.getElementById('eventImageFile');
  const imagePreview = document.getElementById('imagePreview');
  const statusInput  = document.getElementById('eventStatus');

  /* ── Confirm modal refs ── */
  const confirmModal   = document.getElementById('confirmModal');
  const confirmCancel  = document.getElementById('confirmCancel');
  const confirmDelete  = document.getElementById('confirmDelete');

  /* ── State ── */
  let allEvents   = [];
  let deleteId    = null;
  let editingId   = null;
  let uploadTask  = null;

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function initDashboard(user) {
    // Show user info
    userEmail.textContent  = user.email || 'Admin';
    userAvatar.textContent = (user.email || 'A').charAt(0).toUpperCase();

    // Load events
    loadEvents();

    // Real-time listener on events collection
    db.collection('events').orderBy('createdAt', 'desc')
      .onSnapshot((snap) => {
        allEvents = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderTable();
        updateStats();
      });
  }

  /* ═══════════════════════════════════════════
     LOAD EVENTS
  ═══════════════════════════════════════════ */
  function loadEvents() {
    tableContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  }

  /* ═══════════════════════════════════════════
     RENDER TABLE
  ═══════════════════════════════════════════ */
  function renderTable() {
    if (allEvents.length === 0) {
      tableContainer.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📅</div>
          <p>No events yet. Click <strong>"+ Add Event"</strong> to create your first event.</p>
        </div>`;
      return;
    }

    const rows = allEvents.map(ev => {
      const dateStr  = ev.date ? formatDate(ev.date) : 'TBA';
      const timeStr  = ev.time ? formatTime(ev.time) : '';
      const badge    = getStatusBadge(ev.status);
      const thumb    = ev.imageUrl
        ? `<img class="event-thumb" src="${escapeHtml(ev.imageUrl)}" alt="" />`
        : `<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📅</div>`;

      return `
        <tr>
          <td>${thumb}</td>
          <td><strong>${escapeHtml(ev.title || 'Untitled')}</strong></td>
          <td>${dateStr}${timeStr ? ' · ' + timeStr : ''}</td>
          <td>${escapeHtml(ev.location || '—')}</td>
          <td>${badge}</td>
          <td>
            <div class="action-btns">
              <button class="btn-edit" onclick="AdminEvents.edit('${ev.id}')">Edit</button>
              <button class="btn-delete" onclick="AdminEvents.confirmDelete('${ev.id}')">Delete</button>
            </div>
          </td>
        </tr>`;
    }).join('');

    tableContainer.innerHTML = `
      <table class="admin-table">
        <thead>
          <tr>
            <th style="width:70px;"></th>
            <th>Title</th>
            <th>Date</th>
            <th>Location</th>
            <th>Status</th>
            <th style="width:140px;">Actions</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  /* ═══════════════════════════════════════════
     STATS
  ═══════════════════════════════════════════ */
  function updateStats() {
    const today = new Date().toISOString().slice(0, 10);
    const total   = allEvents.length;
    const upcoming = allEvents.filter(e => (e.status === 'upcoming' || e.status === 'tba') && (!e.date || e.date >= today)).length;
    const past     = allEvents.filter(e => e.status === 'past' || (e.date && e.date < today)).length;

    document.getElementById('statEvents').textContent   = total;
    document.getElementById('statUpcoming').textContent = upcoming;
    document.getElementById('statPast').textContent     = past;
  }

  /* ═══════════════════════════════════════════
     MODAL: OPEN / CLOSE
  ═══════════════════════════════════════════ */
  function openModal(eventData) {
    eventForm.reset();
    imagePreview.style.display = 'none';
    imagePreview.src = '';
    editingId = null;

    if (eventData) {
      // Edit mode
      editingId = eventData.id;
      modalTitle.textContent = 'Edit Event';
      eventIdInput.value     = eventData.id;
      titleInput.value       = eventData.title || '';
      descInput.value        = eventData.description || '';
      dateInput.value        = eventData.date || '';
      timeInput.value        = eventData.time || '';
      locInput.value         = eventData.location || '';
      imageInput.value       = eventData.imageUrl || '';
      statusInput.value      = eventData.status || 'upcoming';

      if (eventData.imageUrl) {
        imagePreview.src = eventData.imageUrl;
        imagePreview.style.display = 'block';
      }
    } else {
      // Add mode
      modalTitle.textContent = 'Add New Event';
      eventIdInput.value     = '';
    }

    eventModal.classList.add('show');
  }

  function closeModal() {
    eventModal.classList.remove('show');
    if (uploadTask) {
      uploadTask.cancel();
      uploadTask = null;
    }
  }

  /* ═══════════════════════════════════════════
     SAVE EVENT (Create or Update)
  ═══════════════════════════════════════════ */
  modalSave.addEventListener('click', async () => {
    const title = titleInput.value.trim();
    if (!title) {
      showToast('Please enter an event title.', 'error');
      return;
    }

    modalSave.disabled = true;
    modalSave.textContent = 'Saving…';

    try {
      let imageUrl = imageInput.value.trim();

      // Handle file upload if a file is selected
      if (imageFile.files.length > 0) {
        try {
          imageUrl = await uploadImage(imageFile.files[0]);
        } catch (uploadErr) {
          console.warn('Image upload failed (Storage may not be enabled):', uploadErr);
          showToast('Image upload unavailable — using URL instead. Paste an image URL above.', 'error');
          imageFile.value = '';
        }
      }

      const eventData = {
        title:       title,
        description: descInput.value.trim(),
        date:        dateInput.value || null,
        time:        timeInput.value || null,
        location:    locInput.value.trim(),
        imageUrl:    imageUrl || null,
        status:      statusInput.value,
        updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
      };

      if (editingId) {
        // Update existing
        await db.collection('events').doc(editingId).update(eventData);
        showToast('Event updated successfully!', 'success');
      } else {
        // Create new
        eventData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        await db.collection('events').add(eventData);
        showToast('Event created successfully!', 'success');
      }

      closeModal();
    } catch (err) {
      console.error('Save error:', err);
      showToast('Error saving event: ' + err.message, 'error');
    } finally {
      modalSave.disabled = false;
      modalSave.textContent = 'Save Event';
    }
  });

  /* ═══════════════════════════════════════════
     IMAGE UPLOAD to Firebase Storage
  ═══════════════════════════════════════════ */
  function uploadImage(file) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Upload timed out — Firebase Storage may not be enabled'));
      }, 10000);

      const fileName = 'events/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const ref = storage.ref(fileName);
      uploadTask = ref.put(file);

      uploadTask.on('state_changed',
        null,
        (err) => { clearTimeout(timeout); reject(err); },
        async () => {
          clearTimeout(timeout);
          const url = await ref.getDownloadURL();
          uploadTask = null;
          resolve(url);
        }
      );
    });
  }

  /* ═══════════════════════════════════════════
     IMAGE PREVIEW
  ═══════════════════════════════════════════ */
  imageFile.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        imagePreview.src = ev.target.result;
        imagePreview.style.display = 'block';
      };
      reader.readAsDataURL(file);
    }
  });

  imageInput.addEventListener('input', () => {
    const url = imageInput.value.trim();
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
  function confirmDeleteEvent(id) {
    deleteId = id;
    confirmModal.classList.add('show');
  }

  confirmDelete.addEventListener('click', async () => {
    if (!deleteId) return;
    confirmDelete.disabled = true;
    confirmDelete.textContent = 'Deleting…';

    try {
      await db.collection('events').doc(deleteId).delete();
      showToast('Event deleted.', 'success');
    } catch (err) {
      showToast('Error deleting: ' + err.message, 'error');
    } finally {
      deleteId = null;
      confirmDelete.disabled = false;
      confirmDelete.textContent = 'Delete';
      confirmModal.classList.remove('show');
    }
  });

  confirmCancel.addEventListener('click', () => {
    deleteId = null;
    confirmModal.classList.remove('show');
  });

  /* ═══════════════════════════════════════════
     EDIT
  ═══════════════════════════════════════════ */
  function editEvent(id) {
    const ev = allEvents.find(e => e.id === id);
    if (ev) openModal(ev);
  }

  /* ═══════════════════════════════════════════
     EVENT LISTENERS
  ═══════════════════════════════════════════ */
  btnAddEvent.addEventListener('click', () => openModal(null));
  modalClose.addEventListener('click', closeModal);
  modalCancel.addEventListener('click', closeModal);

  eventModal.addEventListener('click', (e) => {
    if (e.target === eventModal) closeModal();
  });
  confirmModal.addEventListener('click', (e) => {
    if (e.target === confirmModal) {
      deleteId = null;
      confirmModal.classList.remove('show');
    }
  });

  // Sidebar toggle (mobile)
  sidebarToggle.addEventListener('click', () => {
    sidebar.classList.toggle('open');
  });

  // Logout
  logoutBtn.addEventListener('click', async () => {
    await AdminAuth.signOut();
    window.location.href = 'login.html';
  });

  /* ═══════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════ */
  function formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    const [h, m] = timeStr.split(':');
    const hr = parseInt(h, 10);
    const ampm = hr >= 12 ? 'PM' : 'AM';
    const hr12 = hr % 12 || 12;
    return hr12 + ':' + m + ' ' + ampm;
  }

  function getStatusBadge(status) {
    const map = {
      upcoming: '<span class="badge badge-upcoming">Upcoming</span>',
      ongoing:  '<span class="badge badge-upcoming">Ongoing</span>',
      past:     '<span class="badge badge-past">Past</span>',
      tba:      '<span class="badge badge-tba">TBA</span>'
    };
    return map[status] || map.upcoming;
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function showToast(message, type) {
    const container = document.getElementById('toastContainer');
    const toast     = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .3s';
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  /* ── Expose for inline onclick handlers ── */
  window.AdminEvents = {
    edit:        editEvent,
    confirmDelete: confirmDeleteEvent
  };

})();
