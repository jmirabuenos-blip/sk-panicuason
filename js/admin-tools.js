/* Shared search, export, and keyboard tools. */
(() => {
  document.querySelectorAll('[id$="TableContainer"]').forEach(container => {
    const tools = document.createElement('div');
    tools.className = 'admin-list-tools';
    tools.innerHTML = '<label>Search records<input type="search" placeholder="Search title, category or status" /></label><button type="button" class="btn-secondary">Export visible records</button><span role="status" aria-live="polite"></span>';
    container.before(tools);
    const input = tools.querySelector('input');
    const status = tools.querySelector('[role="status"]');
    function filter() {
      const rows = [...container.querySelectorAll('tbody tr')];
      const query = input.value.trim().toLowerCase();
      rows.forEach(row => { row.hidden = !row.textContent.toLowerCase().includes(query); });
      status.textContent = rows.length ? `${rows.filter(r => !r.hidden).length} of ${rows.length} records` : '';
    }
    input.addEventListener('input', filter);
    new MutationObserver(filter).observe(container, { childList: true, subtree: true });
    tools.querySelector('button').addEventListener('click', () => {
      const rows = [...container.querySelectorAll('tr')].filter(row => !row.hidden);
      if (rows.length < 2) { status.textContent = 'No records to export.'; return; }
      const csv = rows.map(row => [...row.cells].slice(1, -1).map(cell => {
        let value = cell.textContent.trim();
        if (/^[=+@\-\t\r]/.test(value)) value = "'" + value;
        return '"' + value.replace(/"/g, '""') + '"';
      }).join(',')).join('\r\n');
      const url = URL.createObjectURL(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }));
      const link = document.createElement('a');
      link.href = url; link.download = 'sk-records.csv'; link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  });
  document.getElementById('toastContainer')?.setAttribute('aria-live', 'polite');
  document.addEventListener('keydown', event => {
    const modal = document.querySelector('.modal-overlay.show');
    if (!modal) return;
    const controls = [...modal.querySelectorAll('button, input, select, textarea, a[href]')].filter(el => !el.disabled && el.getClientRects().length);
    if (event.key === 'Escape' && !modal.querySelector('#modalSave:disabled')) modal.querySelector('#modalCancel, #confirmCancel')?.click();
    if (event.key === 'Tab' && controls.length) {
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
  });
  const password = document.getElementById('password');
  if (password) {
    const toggle = document.createElement('button');
    toggle.type = 'button'; toggle.className = 'password-toggle'; toggle.textContent = 'Show password';
    toggle.addEventListener('click', () => {
      const show = password.type === 'password';
      password.type = show ? 'text' : 'password'; toggle.textContent = show ? 'Hide password' : 'Show password';
    });
    password.after(toggle);
  }
})();
