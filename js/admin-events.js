/* ============================================
   SK ADMIN — admin-events.js
   Dashboard + Event CRUD for Cognify-style admin
============================================ */

(function () {
  'use strict';

  /* ── Protect this page ── */
  AdminAuth.protectPage('login.html').then(function (user) {
    initDashboard(user);
  });

  /* ── DOM refs ── */
  var logoutBtn      = document.getElementById('mobileLogoutBtn');
  var userEmail      = document.getElementById('mobileUserEmail');
  var userAvatar     = document.getElementById('userAvatar');
  var topbarName     = document.getElementById('topbarName');

  /* ── Dashboard DOM refs ── */
  var statEvents        = document.getElementById('statEvents');
  var statAnnouncements = document.getElementById('statAnnouncements');
  var statGallery       = document.getElementById('statGallery');
  var breakdownPercent  = document.getElementById('breakdownPercent');
  var barUpcoming       = document.getElementById('barUpcoming');
  var barPast           = document.getElementById('barPast');
  var barOngoing        = document.getElementById('barOngoing');
  var barTBA            = document.getElementById('barTBA');
  var barFillUpcoming   = document.getElementById('barFillUpcoming');
  var barFillPast       = document.getElementById('barFillPast');
  var barFillOngoing    = document.getElementById('barFillOngoing');
  var barFillTBA        = document.getElementById('barFillTBA');
  var donutTotal        = document.getElementById('donutTotal');
  var segUpcoming       = document.getElementById('segUpcoming');
  var segPast           = document.getElementById('segPast');
  var segOngoing        = document.getElementById('segOngoing');
  var segTBA            = document.getElementById('segTBA');
  var legendUpcoming    = document.getElementById('legendUpcoming');
  var legendPast        = document.getElementById('legendPast');
  var legendOngoing     = document.getElementById('legendOngoing');
  var legendTBA         = document.getElementById('legendTBA');
  var activityFeed      = document.getElementById('activityFeed');

  /* ── Modal refs (sub-pages with event modal) ── */
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
  var tableContainer = document.getElementById('eventsTableContainer');

  var confirmModal   = document.getElementById('confirmModal');
  var confirmCancel  = document.getElementById('confirmCancel');
  var confirmDelete  = document.getElementById('confirmDelete');

  /* ── State ── */
  var allEvents        = [];
  var allAnnouncements = [];
  var allGallery       = [];
  var deleteId         = null;
  var editingId        = null;
  var uploadTask       = null;

  /* ═══════════════════════════════════════════
     INIT
  ═══════════════════════════════════════════ */
  function initDashboard(user) {
    var name = user.email || 'Admin';
    if (userEmail) userEmail.textContent = name;
    if (userAvatar) userAvatar.textContent = name.charAt(0).toUpperCase();
    if (topbarName) topbarName.textContent = name.split('@')[0];

    /* Events */
    db.collection('events').orderBy('createdAt', 'desc')
      .onSnapshot(function (snap) {
        allEvents = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        updateDashboard();
        if (tableContainer) renderTable();
      });

    /* Announcements */
    db.collection('announcements').orderBy('order', 'asc')
      .onSnapshot(function (snap) {
        allAnnouncements = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        var active = allAnnouncements.filter(function (a) { return a.active !== false; }).length;
        if (statAnnouncements) animateNumber(statAnnouncements, active);
      });

    /* Gallery */
    db.collection('gallery').orderBy('order', 'asc')
      .onSnapshot(function (snap) {
        allGallery = snap.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
        if (statGallery) animateNumber(statGallery, allGallery.length);
      });
  }

  /* ═══════════════════════════════════════════
     UPDATE DASHBOARD
  ═══════════════════════════════════════════ */
  function updateDashboard() {
    var today  = new Date().toISOString().slice(0, 10);
    var total  = allEvents.length;
    var upcoming = allEvents.filter(function (e) { return (e.status === 'upcoming' || e.status === 'tba') && (!e.date || e.date >= today); }).length;
    var ongoing  = allEvents.filter(function (e) { return e.status === 'ongoing'; }).length;
    var past     = allEvents.filter(function (e) { return e.status === 'past' || (e.date && e.date < today); }).length;
    var tba      = allEvents.filter(function (e) { return e.status === 'tba'; }).length;

    /* Stat numbers */
    if (statEvents) animateNumber(statEvents, total);

    /* Bar chart */
    if (total > 0) {
      var uPct = Math.round(upcoming / total * 100);
      var pPct = Math.round(past / total * 100);
      var oPct = Math.round(ongoing / total * 100);
      var tPct = Math.round(tba / total * 100);

      if (breakdownPercent) breakdownPercent.textContent = (uPct + oPct) + '%';
      if (barUpcoming) barUpcoming.textContent = uPct + '%';
      if (barPast) barPast.textContent = pPct + '%';
      if (barOngoing) barOngoing.textContent = oPct + '%';
      if (barTBA) barTBA.textContent = tPct + '%';
      if (barFillUpcoming) barFillUpcoming.style.width = uPct + '%';
      if (barFillPast) barFillPast.style.width = pPct + '%';
      if (barFillOngoing) barFillOngoing.style.width = oPct + '%';
      if (barFillTBA) barFillTBA.style.width = tPct + '%';
    }

    /* Donut chart */
    updateDonut(total, upcoming, past, ongoing, tba);

    /* Legend */
    if (legendUpcoming) legendUpcoming.textContent = upcoming;
    if (legendPast) legendPast.textContent = past;
    if (legendOngoing) legendOngoing.textContent = ongoing;
    if (legendTBA) legendTBA.textContent = tba;

    /* Activity */
    renderActivity();
  }

  /* ═══════════════════════════════════════════
     DONUT CHART (SVG stroke-dasharray)
  ═══════════════════════════════════════════ */
  function updateDonut(total, upcoming, past, ongoing, tba) {
    if (!donutTotal) return;
    donutTotal.textContent = total;

    var circumference = 2 * Math.PI * 60; /* r=60 */
    var gap = 6; /* gap between segments */
    var available = circumference - gap * 4;

    if (total === 0) {
      [segUpcoming, segPast, segOngoing, segTBA].forEach(function (el) {
        if (el) { el.setAttribute('stroke-dasharray', '0 ' + circumference); }
      });
      return;
    }

    var segments = [
      { el: segUpcoming, val: upcoming },
      { el: segPast,     val: past },
      { el: segOngoing,  val: ongoing },
      { el: segTBA,      val: tba }
    ];

    var offset = 0;
    segments.forEach(function (seg) {
      if (!seg.el) return;
      var segLen = (seg.val / total) * available;
      seg.el.setAttribute('stroke-dasharray', segLen + ' ' + (circumference - segLen));
      seg.el.setAttribute('stroke-dashoffset', -offset + circumference * 0.25);
      offset += segLen + gap;
    });
  }

  /* ═══════════════════════════════════════════
     ACTIVITY FEED
  ═══════════════════════════════════════════ */
  function renderActivity() {
    if (!activityFeed) return;
    var items = [];

    allEvents.slice(0, 8).forEach(function (ev) {
      var color = '#22c55e', bg = 'rgba(34,197,94,.1)', label = 'Event added';
      if (ev.status === 'past') { color = '#94a3b8'; bg = 'rgba(148,163,184,.1)'; label = 'Completed'; }
      else if (ev.status === 'ongoing') { color = '#ef4444'; bg = 'rgba(239,68,68,.1)'; label = 'Ongoing'; }
      else if (ev.status === 'tba') { color = '#f59e0b'; bg = 'rgba(245,158,11,.1)'; label = 'Scheduled'; }

      items.push({
        color: color, bg: bg,
        text: '<strong>' + esc(ev.title || 'Untitled') + '</strong> — ' + label,
        time: ev.createdAt ? timeAgo(ev.createdAt) : (ev.date || 'Recently'),
        sort: ev.createdAt ? (ev.createdAt.seconds || 0) : 0
      });
    });

    allAnnouncements.slice(0, 4).forEach(function (ann) {
      items.push({
        color: '#8b5cf6', bg: 'rgba(139,92,246,.1)',
        text: '<strong>' + esc(ann.title || 'Untitled') + '</strong> — Announcement',
        time: ann.createdAt ? timeAgo(ann.createdAt) : 'Recently',
        sort: ann.createdAt ? (ann.createdAt.seconds || 0) : 0
      });
    });

    items.sort(function (a, b) { return b.sort - a.sort; });
    items = items.slice(0, 8);

    if (items.length === 0) {
      activityFeed.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128196;</div><p>No recent activity.</p></div>';
      return;
    }

    activityFeed.innerHTML = items.map(function (item) {
      return '<div class="activity-item">' +
        '<div class="activity-icon" style="background:' + item.bg + ';color:' + item.color + ';">' +
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="12" r="10"/></svg>' +
        '</div>' +
        '<div class="activity-text"><p>' + item.text + '</p><span class="activity-time">' + item.time + '</span></div>' +
      '</div>';
    }).join('');
  }

  /* ═══════════════════════════════════════════
     TABLE (sub-pages)
  ═══════════════════════════════════════════ */
  function renderTable() {
    if (!tableContainer) return;
    if (allEvents.length === 0) {
      tableContainer.innerHTML = '<div class="empty-state"><div class="empty-icon">&#128197;</div><p>No events yet.</p></div>';
      return;
    }
    var rows = allEvents.map(function (ev) {
      var dateStr = ev.date ? formatDate(ev.date) : 'TBA';
      var thumb = ev.imageUrl
        ? '<img class="event-thumb" src="' + esc(ev.imageUrl) + '" alt="" />'
        : '<div class="event-thumb" style="display:flex;align-items:center;justify-content:center;color:var(--admin-text-muted);">&#128197;</div>';
      var badge = getStatusBadge(ev.status);
      return '<tr><td>' + thumb + '</td><td><strong>' + esc(ev.title || 'Untitled') + '</strong></td>' +
        '<td>' + dateStr + '</td><td>' + esc(ev.location || '—') + '</td><td>' + badge + '</td>' +
        '<td><div class="action-btns">' +
          '<button class="btn-edit" onclick="AdminEvents.edit(\'' + ev.id + '\')">Edit</button>' +
          '<button class="btn-delete" onclick="AdminEvents.confirmDelete(\'' + ev.id + '\')">Delete</button>' +
        '</div></td></tr>';
    }).join('');
    tableContainer.innerHTML = '<table class="admin-table"><thead><tr>' +
      '<th style="width:60px;"></th><th>Title</th><th>Date</th><th>Location</th><th>Status</th><th style="width:120px;">Actions</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table>';
  }

  /* ═══════════════════════════════════════════
     MODAL OPEN / CLOSE / SAVE
  ═══════════════════════════════════════════ */
  function openModal(evData) {
    if (!eventForm) return;
    eventForm.reset();
    if (imagePreview) { imagePreview.style.display = 'none'; imagePreview.src = ''; }
    editingId = null;
    if (evData) {
      editingId = evData.id;
      if (modalTitle) modalTitle.textContent = 'Edit Event';
      if (eventIdInput) eventIdInput.value = evData.id;
      if (titleInput) titleInput.value = evData.title || '';
      if (descInput) descInput.value = evData.description || '';
      if (dateInput) dateInput.value = evData.date || '';
      if (timeInput) timeInput.value = evData.time || '';
      if (locInput) locInput.value = evData.location || '';
      if (imageInput) imageInput.value = evData.imageUrl || '';
      if (statusInput) statusInput.value = evData.status || 'upcoming';
      if (evData.imageUrl && imagePreview) { imagePreview.src = evData.imageUrl; imagePreview.style.display = 'block'; }
    } else {
      if (modalTitle) modalTitle.textContent = 'Add New Event';
      if (eventIdInput) eventIdInput.value = '';
    }
    if (eventModal) eventModal.classList.add('show');
  }

  function closeModal() {
    if (eventModal) eventModal.classList.remove('show');
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
        var data = {
          title: title, description: descInput ? descInput.value.trim() : '',
          date: dateInput ? dateInput.value || null : null,
          time: timeInput ? timeInput.value || null : null,
          location: locInput ? locInput.value.trim() : '',
          imageUrl: imageUrl || null, status: statusInput ? statusInput.value : 'upcoming',
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (editingId) { await db.collection('events').doc(editingId).update(data); showToast('Event updated!', 'success'); }
        else { data.createdAt = firebase.firestore.FieldValue.serverTimestamp(); await db.collection('events').add(data); showToast('Event created!', 'success'); }
        closeModal();
      } catch (err) { showToast('Error: ' + err.message, 'error'); }
      finally { modalSave.disabled = false; modalSave.textContent = 'Save Event'; }
    });
  }

  function uploadImage(file) {
    return new Promise(function (resolve, reject) {
      var timeout = setTimeout(function () { reject(new Error('Upload timed out')); }, 10000);
      var name = 'events/' + Date.now() + '_' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
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

  /* ═══════════════════════════════════════════
     DELETE
  ═══════════════════════════════════════════ */
  function confirmDeleteEvent(id) { deleteId = id; if (confirmModal) confirmModal.classList.add('show'); }

  if (confirmDelete) {
    confirmDelete.addEventListener('click', async function () {
      if (!deleteId) return;
      confirmDelete.disabled = true; confirmDelete.textContent = 'Deleting…';
      try { await db.collection('events').doc(deleteId).delete(); showToast('Event deleted.', 'success'); }
      catch (err) { showToast('Error: ' + err.message, 'error'); }
      finally { deleteId = null; confirmDelete.disabled = false; confirmDelete.textContent = 'Delete'; if (confirmModal) confirmModal.classList.remove('show'); }
    });
  }
  if (confirmCancel) confirmCancel.addEventListener('click', function () { deleteId = null; if (confirmModal) confirmModal.classList.remove('show'); });

  /* ═══════════════════════════════════════════
     EVENT LISTENERS
  ═══════════════════════════════════════════ */
  if (modalClose) modalClose.addEventListener('click', closeModal);
  if (modalCancel) modalCancel.addEventListener('click', closeModal);
  if (eventModal) eventModal.addEventListener('click', function (e) { if (e.target === eventModal) closeModal(); });
  if (confirmModal) confirmModal.addEventListener('click', function (e) { if (e.target === confirmModal) { deleteId = null; confirmModal.classList.remove('show'); } });
  if (logoutBtn) logoutBtn.addEventListener('click', async function () { await AdminAuth.signOut(); window.location.href = 'login.html'; });

  /* ═══════════════════════════════════════════
     HELPERS
  ═══════════════════════════════════════════ */
  function formatDate(s) { if (!s) return 'TBA'; var d = new Date(s + 'T00:00:00'); return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); }
  function getStatusBadge(st) {
    var m = { upcoming: '<span class="badge badge-upcoming">Upcoming</span>', ongoing: '<span class="badge badge-ongoing">Ongoing</span>', past: '<span class="badge badge-past">Past</span>', tba: '<span class="badge badge-tba">TBA</span>' };
    return m[st] || m.upcoming;
  }
  function esc(s) { var d = document.createElement('div'); d.textContent = s; return d.innerHTML; }
  function timeAgo(ts) {
    if (!ts) return 'Recently';
    var date = ts.seconds ? new Date(ts.seconds * 1000) : (ts.toDate ? ts.toDate() : null);
    if (!date) return 'Recently';
    var diff = Math.floor((new Date() - date) / 1000);
    if (diff < 60) return 'Just now'; if (diff < 3600) return Math.floor(diff/60) + 'm ago';
    if (diff < 86400) return Math.floor(diff/3600) + 'h ago'; if (diff < 604800) return Math.floor(diff/86400) + 'd ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }
  function animateNumber(el, target) {
    var current = parseInt(el.textContent, 10) || 0;
    if (current === target) return;
    var diff = target - current, steps = Math.min(Math.abs(diff), 20), inc = diff / steps, step = 0;
    function tick() { step++; if (step >= steps) { el.textContent = target; return; } el.textContent = Math.round(current + inc * step); requestAnimationFrame(tick); }
    requestAnimationFrame(tick);
  }
  function showToast(msg, type) {
    var c = document.getElementById('toastContainer'); if (!c) return;
    var t = document.createElement('div'); t.className = 'toast ' + (type || ''); t.textContent = msg; c.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; setTimeout(function () { t.remove(); }, 300); }, 3500);
  }

  window.AdminEvents = { edit: function (id) { var ev = allEvents.find(function (e) { return e.id === id; }); if (ev) openModal(ev); }, confirmDelete: confirmDeleteEvent };

})();
