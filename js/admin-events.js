/* ============================================
   SK BARANGAY PANICUASON — admin-events.js
   Dashboard logic + Event CRUD for admin panel.
   Depends on firebase-config.js & admin-auth.js
============================================ */

(function () {
  'use strict';

  /* ── Protect this page ── */
  AdminAuth.protectPage('login.html').then(function (user) {
    initDashboard(user);
  });

  /* ── DOM refs ── */
  var sidebar        = document.getElementById('adminSidebar');
  var sidebarToggle  = document.getElementById('sidebarToggle');
  var logoutBtn      = document.getElementById('logoutBtn');
  var userEmail      = document.getElementById('userEmail');
  var userAvatar     = document.getElementById('userAvatar');
  var topbarName     = document.getElementById('topbarName');
  var btnAddEvent    = document.getElementById('btnAddEvent');
  var tableContainer = document.getElementById('eventsTableContainer');

  /* ── Dashboard DOM refs ── */
  var statEvents        = document.getElementById('statEvents');
  var statUpcoming      = document.getElementById('statUpcoming');
  var statAnnouncements = document.getElementById('statAnnouncements');
  var donutChart        = document.getElementById('donutChart');
  var donutTotal        = document.getElementById('donutTotal');
  var legendUpcoming    = document.getElementById('legendUpcoming');
  var legendOngoing     = document.getElementById('legendOngoing');
  var legendPast        = document.getElementById('legendPast');
  var legendTBA         = document.getElementById('legendTBA');
  var recentEventsContainer = document.getElementById('recentEventsContainer');
  var activityFeed      = document.getElementById('activityFeed');

  /* ── Modal refs (only on pages with the modal) ── */
  var eventModal   = document.getElementById('eventModal');
  var modalTitle   = document.getElementById('modalTitle');
  var modalClose   = document.getElementById('modalClose');
  var modalCancel  = document.getElementById('modalCancel');
  var modalSave    = document.getElementById('modalSave');
  var eventForm    = document.getElementById('eventForm');
  var eventIdInput = document.getElementById('eventId');
  var titleInput   = document.getElementById('eventTitle');
  var descInput    = document.getElementById('eventDescription');
  var dateInput    = document.getElementById('eventDate');
  var timeInput    = document.getElementById('eventTime');
  var locInput     = document.getElementById('eventLocation');
  var imageInput   = document.getElementById('eventImage');
  var imageFile    = document.getElementById('eventImageFile');
  var imagePreview = document.getElementById('imagePreview');
  var statusInput  = document.getElementById('eventStatus');

  /* ── Confirm modal refs ── */
  var confirmModal   = document.getElementById('confirmModal');
  var confirmCancel  = document.getElementById('confirmCancel');
  var confirmDelete  = document.getElementById('confirmDelete');

  /* ── State ── */
  var allEvents     = [];
  var allAnnouncements = [];
  var deleteId      = null;
  var editingId     = null;
  var uploadTask    = null;

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function initDashboard(user) {
    // Show user info
    var displayName = user.email || 'Admin';
    userEmail.textContent  = displayName;
    userAvatar.textContent = displayName.charAt(0).toUpperCase();
    if (topbarName) topbarName.textContent = displayName.split('@')[0];

    // Load events
    loadEvents();

    // Real-time listener on events collection
    db.collection('events').orderBy('createdAt', 'desc')
      .onSnapshot(function (snap) {
        allEvents = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        updateDashboard();
        if (tableContainer) renderTable();
      });

    // Real-time listener on announcements
    db.collection('announcements').orderBy('order', 'asc')
      .onSnapshot(function (snap) {
        allAnnouncements = snap.docs.map(function (doc) {
          return Object.assign({ id: doc.id }, doc.data());
        });
        updateAnnouncementsStat();
      });
  }

  /* ═══════════════════════════════════════════
     LOAD EVENTS (initial placeholder)
  ═══════════════════════════════════════════ */
  function loadEvents() {
    if (tableContainer) {
      tableContainer.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
    }
  }

  /* ═══════════════════════════════════════════
     UPDATE DASHBOARD
  ═══════════════════════════════════════════ */
  function updateDashboard() {
    var today = new Date().toISOString().slice(0, 10);
    var total    = allEvents.length;
    var upcoming = allEvents.filter(function (e) {
      return (e.status === 'upcoming' || e.status === 'tba') && (!e.date || e.date >= today);
    }).length;
    var ongoing  = allEvents.filter(function (e) { return e.status === 'ongoing'; }).length;
    var past     = allEvents.filter(function (e) {
      return e.status === 'past' || (e.date && e.date < today);
    }).length;
    var tba      = allEvents.filter(function (e) { return e.status === 'tba'; }).length;

    // Update stat numbers
    if (statEvents)   animateNumber(statEvents, total);
    if (statUpcoming) animateNumber(statUpcoming, upcoming);

    // Update donut chart
    updateDonutChart(total, upcoming, ongoing, past, tba);

    // Update legend
    if (legendUpcoming) legendUpcoming.textContent = upcoming;
    if (legendOngoing)  legendOngoing.textContent = ongoing;
    if (legendPast)     legendPast.textContent = past;
    if (legendTBA)      legendTBA.textContent = tba;

    // Update recent events
    renderRecentEvents();

    // Update activity feed
    renderActivityFeed();
  }

  /* ═══════════════════════════════════════════
     UPDATE ANNOUNCEMENTS STAT
  ═══════════════════════════════════════════ */
  function updateAnnouncementsStat() {
    var active = allAnnouncements.filter(function (a) { return a.active !== false; }).length;
    if (statAnnouncements) animateNumber(statAnnouncements, active);
  }

  /* ═══════════════════════════════════════════
     DONUT CHART
  ═══════════════════════════════════════════ */
  function updateDonutChart(total, upcoming, ongoing, past, tba) {
    if (!donutChart || !donutTotal) return;

    donutTotal.textContent = total;

    if (total === 0) {
      donutChart.style.background = '#e2e8f0';
      return;
    }

    var uPct = (upcoming / total) * 100;
    var oPct = (ongoing / total) * 100;
    var pPct = (past / total) * 100;
    var tPct = (tba / total) * 100;

    var uEnd = uPct;
    var oEnd = uEnd + oPct;
    var pEnd = oEnd + pPct;
    var tEnd = pEnd + tPct;

    donutChart.style.background =
      'conic-gradient(' +
      '#0ea5e9 0% ' + uEnd + '%, ' +
      '#10b981 ' + uEnd + '% ' + oEnd + '%, ' +
      '#8b5cf6 ' + oEnd + '% ' + pEnd + '%, ' +
      '#f59e0b ' + pEnd + '% ' + tEnd + '%, ' +
      '#e2e8f0 ' + tEnd + '% 100%)';
  }

  /* ═══════════════════════════════════════════
     RECENT EVENTS
  ═══════════════════════════════════════════ */
  function renderRecentEvents() {
    if (!recentEventsContainer) return;

    var recent = allEvents.slice(0, 5);

    if (recent.length === 0) {
      recentEventsContainer.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">📅</div>' +
        '<p>No events yet.</p>' +
        '</div>';
      return;
    }

    var html = recent.map(function (ev) {
      var dateStr = ev.date ? formatDate(ev.date) : 'TBA';
      var badge = getStatusBadge(ev.status);
      var thumb;

      if (ev.imageUrl) {
        thumb = '<div class="recent-event-thumb"><img src="' + escapeHtml(ev.imageUrl) + '" alt="" /></div>';
      } else {
        thumb = '<div class="recent-event-thumb">📅</div>';
      }

      return '<div class="recent-event-item">' +
        thumb +
        '<div class="recent-event-info">' +
          '<div class="recent-event-title">' + escapeHtml(ev.title || 'Untitled') + '</div>' +
          '<div class="recent-event-meta">' + dateStr + (ev.location ? ' · ' + escapeHtml(ev.location) : '') + '</div>' +
        '</div>' +
        badge +
        '</div>';
    }).join('');

    recentEventsContainer.innerHTML = html;
  }

  /* ═══════════════════════════════════════════
     ACTIVITY FEED
  ═══════════════════════════════════════════ */
  function renderActivityFeed() {
    if (!activityFeed) return;

    var items = [];

    // Add events to activity
    allEvents.slice(0, 10).forEach(function (ev) {
      var icon = '📅';
      var bg = 'rgba(14,165,233,.1)';
      var color = '#0ea5e9';
      var action = 'Event added';

      if (ev.status === 'past') {
        icon = '✅'; bg = 'rgba(16,185,129,.1)'; color = '#10b981'; action = 'Event completed';
      } else if (ev.status === 'ongoing') {
        icon = '🔴'; bg = 'rgba(239,68,68,.1)'; color = '#ef4444'; action = 'Event ongoing';
      } else if (ev.status === 'tba') {
        icon = '⏳'; bg = 'rgba(245,158,11,.1)'; color = '#f59e0b'; action = 'Event scheduled';
      }

      var timeStr = ev.createdAt
        ? timeAgo(ev.createdAt)
        : (ev.date ? formatDate(ev.date) : 'Recently');

      items.push({
        icon: icon,
        bg: bg,
        color: color,
        text: '<strong>' + escapeHtml(ev.title || 'Untitled') + '</strong> — ' + action,
        time: timeStr,
        sort: ev.createdAt ? (ev.createdAt.seconds || 0) : 0
      });
    });

    // Add announcements to activity
    allAnnouncements.slice(0, 5).forEach(function (ann) {
      items.push({
        icon: '📢',
        bg: 'rgba(139,92,246,.1)',
        color: '#8b5cf6',
        text: '<strong>' + escapeHtml(ann.title || 'Untitled') + '</strong> — Announcement ' + (ann.active !== false ? 'published' : 'hidden'),
        time: ann.createdAt ? timeAgo(ann.createdAt) : 'Recently',
        sort: ann.createdAt ? (ann.createdAt.seconds || 0) : 0
      });
    });

    // Sort by most recent
    items.sort(function (a, b) { return b.sort - a.sort; });

    // Take top 8
    items = items.slice(0, 8);

    if (items.length === 0) {
      activityFeed.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">📋</div>' +
        '<p>No recent activity.</p>' +
        '</div>';
      return;
    }

    var html = items.map(function (item) {
      return '<div class="activity-item">' +
        '<div class="activity-icon" style="background:' + item.bg + '; color:' + item.color + ';">' + item.icon + '</div>' +
        '<div class="activity-text">' +
          '<p>' + item.text + '</p>' +
          '<span class="activity-time">' + item.time + '</span>' +
        '</div>' +
        '</div>';
    }).join('');

    activityFeed.innerHTML = html;
  }

  /* ═══════════════════════════════════════════
     RENDER TABLE (for events sub-page)
  ═══════════════════════════════════════════ */
  function renderTable() {
    if (!tableContainer) return;

    if (allEvents.length === 0) {
      tableContainer.innerHTML =
        '<div class="empty-state">' +
        '<div class="empty-icon">📅</div>' +
        '<p>No events yet. Click <strong>"+ Add Event"</strong> to create your first event.</p>' +
        '</div>';
      return;
    }

    var rows = allEvents.map(function (ev) {
      var dateStr = ev.date ? formatDate(ev.date) : 'TBA';
      var timeStr = ev.time ? formatTime(ev.time) : '';
      var badge   = getStatusBadge(ev.status);
      var thumb;

      if (ev.imageUrl) {
        thumb = '<img class="event-thumb" src="' + escapeHtml(ev.imageUrl) + '" alt="" />';
      } else {
        thumb = '<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;font-size:1.2rem;">📅</div>';
      }

      return '<tr>' +
        '<td>' + thumb + '</td>' +
        '<td><strong>' + escapeHtml(ev.title || 'Untitled') + '</strong></td>' +
        '<td>' + dateStr + (timeStr ? ' · ' + timeStr : '') + '</td>' +
        '<td>' + escapeHtml(ev.location || '—') + '</td>' +
        '<td>' + badge + '</td>' +
        '<td>' +
          '<div class="action-btns">' +
            '<button class="btn-edit" onclick="AdminEvents.edit(\'' + ev.id + '\')">Edit</button>' +
            '<button class="btn-delete" onclick="AdminEvents.confirmDelete(\'' + ev.id + '\')">Delete</button>' +
          '</div>' +
        '</td>' +
        '</tr>';
    }).join('');

    tableContainer.innerHTML =
      '<table class="admin-table">' +
      '<thead><tr>' +
        '<th style="width:70px;"></th>' +
        '<th>Title</th>' +
        '<th>Date</th>' +
        '<th>Location</th>' +
        '<th>Status</th>' +
        '<th style="width:140px;">Actions</th>' +
      '</tr></thead>' +
      '<tbody>' + rows + '</tbody>' +
      '</table>';
  }

  /* ═══════════════════════════════════════════
     MODAL: OPEN / CLOSE
  ═══════════════════════════════════════════ */
  function openModal(eventData) {
    if (!eventForm) return;
    eventForm.reset();
    if (imagePreview) {
      imagePreview.style.display = 'none';
      imagePreview.src = '';
    }
    editingId = null;

    if (eventData) {
      editingId = eventData.id;
      if (modalTitle) modalTitle.textContent = 'Edit Event';
      if (eventIdInput) eventIdInput.value = eventData.id;
      if (titleInput) titleInput.value = eventData.title || '';
      if (descInput) descInput.value = eventData.description || '';
      if (dateInput) dateInput.value = eventData.date || '';
      if (timeInput) timeInput.value = eventData.time || '';
      if (locInput) locInput.value = eventData.location || '';
      if (imageInput) imageInput.value = eventData.imageUrl || '';
      if (statusInput) statusInput.value = eventData.status || 'upcoming';

      if (eventData.imageUrl && imagePreview) {
        imagePreview.src = eventData.imageUrl;
        imagePreview.style.display = 'block';
      }
    } else {
      if (modalTitle) modalTitle.textContent = 'Add New Event';
      if (eventIdInput) eventIdInput.value = '';
    }

    if (eventModal) eventModal.classList.add('show');
  }

  function closeModal() {
    if (eventModal) eventModal.classList.remove('show');
    if (uploadTask) {
      uploadTask.cancel();
      uploadTask = null;
    }
  }

  /* ═══════════════════════════════════════════
     SAVE EVENT (Create or Update)
  ═══════════════════════════════════════════ */
  if (modalSave) {
    modalSave.addEventListener('click', async function () {
      var title = titleInput ? titleInput.value.trim() : '';
      if (!title) {
        showToast('Please enter an event title.', 'error');
        return;
      }

      modalSave.disabled = true;
      modalSave.textContent = 'Saving…';

      try {
        var imageUrl = imageInput ? imageInput.value.trim() : '';

        // Handle file upload if a file is selected
        if (imageFile && imageFile.files.length > 0) {
          try {
            imageUrl = await uploadImage(imageFile.files[0]);
          } catch (uploadErr) {
            console.warn('Image upload failed:', uploadErr);
            showToast('Image upload unavailable — using URL instead.', 'error');
            imageFile.value = '';
          }
        }

        var eventData = {
          title:       title,
          description: descInput ? descInput.value.trim() : '',
          date:        dateInput ? dateInput.value || null : null,
          time:        timeInput ? timeInput.value || null : null,
          location:    locInput ? locInput.value.trim() : '',
          imageUrl:    imageUrl || null,
          status:      statusInput ? statusInput.value : 'upcoming',
          updatedAt:   firebase.firestore.FieldValue.serverTimestamp()
        };

        if (editingId) {
          await db.collection('events').doc(editingId).update(eventData);
          showToast('Event updated successfully!', 'success');
        } else {
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
  }

  /* ═══════════════════════════════════════════
     IMAGE UPLOAD to Firebase Storage
  ═══════════════════════════════════════════ */
  function uploadImage(file) {
    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () {
        reject(new Error('Upload timed out'));
      }, 10000);

      var fileName = 'events/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      var ref = storage.ref(fileName);
      uploadTask = ref.put(file);

      uploadTask.on('state_changed',
        null,
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

  /* ═══════════════════════════════════════════
     IMAGE PREVIEW
  ═══════════════════════════════════════════ */
  if (imageFile) {
    imageFile.addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (file && imagePreview) {
        var reader = new FileReader();
        reader.onload = function (ev) {
          imagePreview.src = ev.target.result;
          imagePreview.style.display = 'block';
        };
        reader.readAsDataURL(file);
      }
    });
  }

  if (imageInput) {
    imageInput.addEventListener('input', function () {
      var url = imageInput.value.trim();
      if (url && imagePreview) {
        imagePreview.src = url;
        imagePreview.style.display = 'block';
      } else if (imagePreview) {
        imagePreview.style.display = 'none';
      }
    });
  }

  /* ═══════════════════════════════════════════
     DELETE
  ═══════════════════════════════════════════ */
  function confirmDeleteEvent(id) {
    deleteId = id;
    if (confirmModal) confirmModal.classList.add('show');
  }

  if (confirmDelete) {
    confirmDelete.addEventListener('click', async function () {
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
        if (confirmModal) confirmModal.classList.remove('show');
      }
    });
  }

  if (confirmCancel) {
    confirmCancel.addEventListener('click', function () {
      deleteId = null;
      if (confirmModal) confirmModal.classList.remove('show');
    });
  }

  /* ═══════════════════════════════════════════
     EDIT
  ═══════════════════════════════════════════ */
  function editEvent(id) {
    var ev = allEvents.find(function (e) { return e.id === id; });
    if (ev) openModal(ev);
  }

  /* ═══════════════════════════════════════════
     EVENT LISTENERS
  ═══════════════════════════════════════════ */
  if (btnAddEvent) btnAddEvent.addEventListener('click', function () { openModal(null); });
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCancel) modalCancel.addEventListener('click', closeModal);

  if (eventModal) {
    eventModal.addEventListener('click', function (e) {
      if (e.target === eventModal) closeModal();
    });
  }

  if (confirmModal) {
    confirmModal.addEventListener('click', function (e) {
      if (e.target === confirmModal) {
        deleteId = null;
        confirmModal.classList.remove('show');
      }
    });
  }

  // Sidebar toggle (mobile)
  if (sidebarToggle) {
    sidebarToggle.addEventListener('click', function () {
      sidebar.classList.toggle('open');
    });
  }

  // Logout
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async function () {
      await AdminAuth.signOut();
      window.location.href = 'login.html';
    });
  }

  /* ═══════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════ */
  function formatDate(dateStr) {
    if (!dateStr) return 'TBA';
    var d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatTime(timeStr) {
    if (!timeStr) return '';
    var parts = timeStr.split(':');
    var hr = parseInt(parts[0], 10);
    var ampm = hr >= 12 ? 'PM' : 'AM';
    var hr12 = hr % 12 || 12;
    return hr12 + ':' + parts[1] + ' ' + ampm;
  }

  function getStatusBadge(status) {
    var map = {
      upcoming: '<span class="recent-event-badge badge-upcoming">Upcoming</span>',
      ongoing:  '<span class="recent-event-badge badge-ongoing">Ongoing</span>',
      past:     '<span class="recent-event-badge badge-past">Past</span>',
      tba:      '<span class="recent-event-badge badge-tba">TBA</span>'
    };
    return map[status] || map.upcoming;
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function timeAgo(timestamp) {
    if (!timestamp) return 'Recently';
    var date;
    if (timestamp.seconds) {
      date = new Date(timestamp.seconds * 1000);
    } else if (timestamp.toDate) {
      date = timestamp.toDate();
    } else {
      return 'Recently';
    }

    var now = new Date();
    var diff = Math.floor((now - date) / 1000);

    if (diff < 60) return 'Just now';
    if (diff < 3600) return Math.floor(diff / 60) + 'm ago';
    if (diff < 86400) return Math.floor(diff / 3600) + 'h ago';
    if (diff < 604800) return Math.floor(diff / 86400) + 'd ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  function animateNumber(el, target) {
    var current = parseInt(el.textContent, 10) || 0;
    if (current === target) return;

    var diff = target - current;
    var steps = Math.min(Math.abs(diff), 20);
    var increment = diff / steps;
    var step = 0;

    function tick() {
      step++;
      if (step >= steps) {
        el.textContent = target;
        return;
      }
      el.textContent = Math.round(current + increment * step);
      requestAnimationFrame(tick);
    }

    requestAnimationFrame(tick);
  }

  function showToast(message, type) {
    var container = document.getElementById('toastContainer');
    if (!container) return;
    var toast = document.createElement('div');
    toast.className = 'toast ' + (type || '');
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(function () {
      toast.style.opacity = '0';
      toast.style.transition = 'opacity .3s';
      setTimeout(function () { toast.remove(); }, 300);
    }, 3500);
  }

  /* ── Expose for inline onclick handlers ── */
  window.AdminEvents = {
    edit:          editEvent,
    confirmDelete: confirmDeleteEvent
  };

})();
