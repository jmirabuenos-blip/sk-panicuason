/* admin-nav.js — shared mobile nav toggle for admin pages */
(function() {
  var h = document.getElementById('adminHamburger');
  var o = document.getElementById('mobileNavOverlay');
  var p = document.getElementById('mobileNavPanel');
  var c = document.getElementById('mobileNavClose');
  if (!h || !o || !p) return;
  h.setAttribute('aria-expanded', 'false');
  h.setAttribute('aria-controls', 'mobileNavPanel');
  if (c) c.setAttribute('aria-label', 'Close navigation');
  p.inert = true;
  function open() { o.classList.add('show'); p.classList.add('show'); p.inert = false; h.setAttribute('aria-expanded', 'true'); document.body.style.overflow='hidden'; if (c) c.focus(); }
  function close() { o.classList.remove('show'); p.classList.remove('show'); p.inert = true; h.setAttribute('aria-expanded', 'false'); document.body.style.overflow=''; h.focus(); }
  document.addEventListener('keydown', function(e) {
    if (!p.classList.contains('show')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'Tab') {
      var items = Array.from(p.querySelectorAll('a, button'));
      if (e.shiftKey && document.activeElement === items[0]) { e.preventDefault(); items[items.length - 1].focus(); }
      else if (!e.shiftKey && document.activeElement === items[items.length - 1]) { e.preventDefault(); items[0].focus(); }
    }
  });
  window.addEventListener('resize', function() { if (getComputedStyle(h).display === 'none' && p.classList.contains('show')) close(); });
  if(h) h.addEventListener('click',open);
  if(o) o.addEventListener('click',close);
  if(c) c.addEventListener('click',close);
})();
