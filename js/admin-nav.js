/* admin-nav.js — shared mobile nav toggle for admin pages */
(function() {
  var h = document.getElementById('adminHamburger');
  var o = document.getElementById('mobileNavOverlay');
  var p = document.getElementById('mobileNavPanel');
  var c = document.getElementById('mobileNavClose');
  function open() { o.classList.add('show'); p.classList.add('show'); document.body.style.overflow='hidden'; }
  function close() { o.classList.remove('show'); p.classList.remove('show'); document.body.style.overflow=''; }
  if(h) h.addEventListener('click',open);
  if(o) o.addEventListener('click',close);
  if(c) c.addEventListener('click',close);
})();
