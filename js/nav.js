/* ============================================
   SK BARANGAY PANICUASON — nav.js
   Shared navigation component.
   Drop <div id="sk-nav"></div> at the top of
   <body> on every page, then load this script.
============================================ */

(function () {

  const NAV_LINKS = [
    { label: 'Home',             href: 'index.html' },
    { label: 'About',            href: 'about.html' },
    { label: 'Council',          href: 'council.html' },
    { label: 'Programs',         href: 'programs.html' },
    { label: 'Events',           href: 'events.html' },
    { label: 'Gallery',          href: 'gallery.html' },
    { label: 'Budget',           href: 'budget.html' },
    { label: 'Contact',          href: 'contact.html' },
  ];

  /* ── Detect active page ── */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';

  /* ── Build nav HTML ── */
  const linksHTML = NAV_LINKS.map(link => {
    const isActive = currentPage === link.href ? ' class="active"' : '';
    return `<li><a href="${link.href}"${isActive}>${link.label}</a></li>`;
  }).join('');

  const navHTML = `
    <nav class="navbar" id="sk-navbar">
      <div class="nav-inner">
        <a href="index.html" class="nav-logo">
          <img src="images/logo.jpg" alt="SK Barangay Panicuason seal" />
          <div class="nav-logo-text">
            <span class="top">Sangguniang Kabataan</span>
            <span class="sub">Barangay Panicuason · Naga City</span>
          </div>
        </a>
        <ul class="nav-links" id="navLinks">
          ${linksHTML}
        </ul>
        <button class="nav-hamburger" id="hamburger" aria-label="Toggle menu" aria-expanded="false">
          <span></span><span></span><span></span>
        </button>
      </div>
    </nav>
  `;

  /* ── Inject into #sk-nav or prepend to body ── */
  const mount = document.getElementById('sk-nav');
  if (mount) {
    mount.insertAdjacentHTML('afterend', navHTML);
    mount.remove();
  } else {
    document.body.insertAdjacentHTML('afterbegin', navHTML);
  }

  /* ── Hamburger toggle ── */
  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('navLinks');

  if (hamburger && navLinks) {
    hamburger.addEventListener('click', function () {
      const isOpen = navLinks.classList.toggle('open');
      hamburger.setAttribute('aria-expanded', isOpen);
    });

    /* Close menu when a link is clicked (mobile) */
    navLinks.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ── Scroll shadow ── */
  window.addEventListener('scroll', function () {
    const navbar = document.getElementById('sk-navbar');
    if (navbar) {
      navbar.style.boxShadow = window.scrollY > 10
        ? '0 2px 24px rgba(0,0,0,0.22)'
        : '';
    }
  });

})();